import {Injectable} from '@nestjs/common';
import {UnauthenticatedActor} from '../../../domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '../../../domain/@shared/exceptions';
import {GlobalRole} from '../../../domain/auth';
import {EventDispatcher} from '../../../domain/event';
import {ProfessionalId} from '../../../domain/professional/entities';
import {User} from '../../../domain/user/entities';
import {Token, TokenProvider, TokenScope} from '../../../domain/user/token';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {SignInDto} from '../dtos';

type SignInResponse = {
    token: Token;
    professionalId: ProfessionalId | undefined;
};

@Injectable()
export class SignInService implements ApplicationService<SignInDto, SignInResponse, UnauthenticatedActor> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenProvider: TokenProvider,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<SignInDto, UnauthenticatedActor>): Promise<SignInResponse> {
        const {username, password} = payload;

        const user = await this.userRepository.findByUsername(username);

        if (user === null) {
            throw new AccessDeniedException(
                `No user found with username "${username}".`,
                AccessDeniedReason.UNKNOWN_USER
            );
        }

        if (user.professionals.length === 0 && user.globalRole === GlobalRole.NONE) {
            throw new AccessDeniedException(
                `The user "${username}" is not allowed to access the system.`,
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        await user.signIn(password);

        const token = await this.tokenProvider.issue(user.id, {
            scope: [TokenScope.AUTH],
            professionals: user.professionals,
        });

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);

        return {
            token,
            professionalId: this.getAccessProfessional(user),
        };
    }

    /**
     * Get the professional that the user has access to.
     *
     * @param user The user that signed in.
     * @param professionalId The professional that the user wants to access.
     * @returns The requested professional if the user has access to it, otherwise the first professional the user has access to.
     * @returns Undefined if the user has no access to any professional.
     */
    private getAccessProfessional(user: User, professionalId?: ProfessionalId | null): ProfessionalId | undefined {
        return professionalId != null && user.professionals.some((id) => id.equals(professionalId))
            ? professionalId
            : user.professionals.at(0);
    }
}
