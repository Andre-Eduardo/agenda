import {Injectable} from '@nestjs/common';
import {UnauthenticatedActor} from '../../../domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '../../../domain/@shared/exceptions';
import {GlobalRole} from '../../../domain/auth';
import {CompanyId} from '../../../domain/company/entities';
import {EventDispatcher} from '../../../domain/event';
import {User} from '../../../domain/user/entities';
import {Token, TokenProvider, TokenScope} from '../../../domain/user/token';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {SignInDto} from '../dtos';

type SignInResponse = {
    token: Token;
    companyId: CompanyId | undefined;
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

        if (user.companies.length === 0 && user.globalRole === GlobalRole.NONE) {
            throw new AccessDeniedException(
                `The user "${username}" is not allowed to access the system.`,
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        await user.signIn(password);

        const token = await this.tokenProvider.issue(user.id, {
            scope: [TokenScope.AUTH],
            companies: user.companies,
        });

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);

        return {
            token,
            companyId: this.getAccessCompany(user, payload.companyId),
        };
    }

    /**
     * Get the company that the user has access to.
     *
     * @param user The user that signed in.
     * @param companyId The company that the user wants to access.
     * @returns The requested company if the user has access to it, otherwise the first company the user has access to.
     * @returns Undefined if the user has no access to any company.
     */
    private getAccessCompany(user: User, companyId?: CompanyId | null): CompanyId | undefined {
        return companyId != null && user.companies.some((id) => id.equals(companyId))
            ? companyId
            : user.companies.at(0);
    }
}
