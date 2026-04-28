import {Injectable} from '@nestjs/common';
import {UnauthenticatedActor} from '../../../domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '../../../domain/@shared/exceptions';
import {GlobalRole} from '../../../domain/auth';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {EventDispatcher} from '../../../domain/event';
import {User} from '../../../domain/user/entities';
import {Token, TokenClinicMember, TokenProvider, TokenScope} from '../../../domain/user/token';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {SignInDto} from '../dtos';

type SignInResponse = {
    token: Token;
    clinicMemberId: ClinicMemberId | undefined;
};

@Injectable()
export class SignInService implements ApplicationService<SignInDto, SignInResponse, UnauthenticatedActor> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly tokenProvider: TokenProvider,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<SignInDto, UnauthenticatedActor>): Promise<SignInResponse> {
        const {username, password} = payload;

        const user = await this.userRepository.findByUsername(username);

        if (user === null) {
            throw new AccessDeniedException(
                `No user found with username "${username}".`,
                AccessDeniedReason.UNKNOWN_USER,
            );
        }

        if (user.clinicMembers.length === 0 && user.globalRole === GlobalRole.NONE) {
            throw new AccessDeniedException(
                `The user "${username}" is not allowed to access the system.`,
                AccessDeniedReason.NOT_ALLOWED,
            );
        }

        await user.signIn(password);

        // Resolve the full {clinicMemberId, clinicId} payload for each membership.
        // If a ClinicMember row was deleted out from under the User aggregate,
        // drop it silently from the JWT instead of failing sign-in.
        const clinicMembers: TokenClinicMember[] = [];

        for (const memberId of user.clinicMembers) {
            const member = await this.clinicMemberRepository.findById(memberId);

            if (member !== null) {
                clinicMembers.push({
                    clinicMemberId: member.id,
                    clinicId: member.clinicId,
                });
            }
        }

        const selectedMemberId = this.getAccessClinicMember(user, payload.clinicMemberId);

        const token = await this.tokenProvider.issue(user.id, {
            scope: [TokenScope.AUTH],
            clinicMembers,
            clinicMemberId: selectedMemberId,
        });

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);

        return {
            token,
            clinicMemberId: selectedMemberId,
        };
    }

    /**
     * Picks which ClinicMember the new session is scoped to.
     *
     * If the caller asked for a specific membership and the user has access to it,
     * use that one. Otherwise fall back to the first membership the user has.
     */
    private getAccessClinicMember(user: User, clinicMemberId?: ClinicMemberId | null): ClinicMemberId | undefined {
        if (clinicMemberId != null && user.clinicMembers.some((id) => id.equals(clinicMemberId))) {
            return clinicMemberId;
        }

        return user.clinicMembers.at(0);
    }
}
