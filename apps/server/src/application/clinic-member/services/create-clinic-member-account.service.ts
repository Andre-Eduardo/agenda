import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberDto, CreateClinicMemberAccountDto} from '@application/clinic-member/dtos';
import {CreateClinicMemberService} from '@application/clinic-member/services/create-clinic-member.service';
import {AccessDeniedException, AccessDeniedReason, PreconditionException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {EventDispatcher} from '@domain/event';
import {User} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import {UserRepository} from '@domain/user/user.repository';

/**
 * Creates a login for a new team member and adds it to the actor's clinic in one step.
 *
 * Replaces the old "public sign-up + invite" flow of the team screen: the account is created
 * with GlobalRole.NONE (User.create), so a member can only act inside the clinics they belong
 * to and cannot create clinics of their own. The manager check, seat reservation and member
 * creation are the same as POST /clinic-members/invite; the transaction rolls the user back if
 * any of them fails.
 */
@Injectable()
export class CreateClinicMemberAccountService implements ApplicationService<
    CreateClinicMemberAccountDto,
    ClinicMemberDto
> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly createClinicMemberService: CreateClinicMemberService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<CreateClinicMemberAccountDto>): Promise<ClinicMemberDto> {
        if (actor.clinicId === null) {
            throw new AccessDeniedException('Clinic manager required.', AccessDeniedReason.NOT_ALLOWED);
        }

        const user = await User.create({
            name: payload.name,
            username: payload.username,
            email: payload.email,
            password: payload.password,
            clinicMembers: [],
        });

        try {
            await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof DuplicateUsernameException) {
                throw new PreconditionException('Cannot create a user with a username already in use.');
            }

            if (error instanceof DuplicateEmailException) {
                throw new PreconditionException('Cannot create a user with an email already in use.');
            }

            throw error;
        }

        const member = await this.createClinicMemberService.execute({
            actor,
            payload: {
                clinicId: actor.clinicId.toString(),
                userId: user.id.toString(),
                roles: payload.roles,
                displayName: payload.displayName ?? payload.name,
                color: payload.color ?? null,
                acceptExtraCharge: payload.acceptExtraCharge,
            },
        });

        this.eventDispatcher.dispatch(actor, user);

        return member;
    }
}
