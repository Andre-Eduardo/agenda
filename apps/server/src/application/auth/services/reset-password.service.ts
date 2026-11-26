import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ResetPasswordDto} from '@application/auth/dtos';
import {PASSWORD_FINGERPRINT_CLAIM} from '@application/auth/services/request-password-reset.service';
import {UnauthenticatedActor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {Token, TokenProvider, TokenScope} from '@domain/user/token';
import {UserRepository} from '@domain/user/user.repository';

export const INVALID_RESET_LINK = 'The password reset link is invalid or has expired.';

/**
 * Sets a new password from the e-mailed link. The token must be a valid RECOVERY token whose
 * password fingerprint still matches the account, so each link works once and every older link
 * dies as soon as the password changes.
 */
@Injectable()
export class ResetPasswordService implements ApplicationService<ResetPasswordDto, void, UnauthenticatedActor> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenProvider: TokenProvider,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<ResetPasswordDto, UnauthenticatedActor>): Promise<void> {
        const token = this.parseToken(payload.token);

        if (
            token === null ||
            !token.scope.includes(TokenScope.RECOVERY) ||
            !(await this.tokenProvider.validate(token))
        ) {
            throw new PreconditionException(INVALID_RESET_LINK);
        }

        const user = await this.userRepository.findById(token.userId);

        if (user === null || token.metadata?.[PASSWORD_FINGERPRINT_CLAIM] !== user.password.fingerprint()) {
            throw new PreconditionException(INVALID_RESET_LINK);
        }

        await user.changePassword(payload.newPassword);
        await this.userRepository.save(user);

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);
    }

    private parseToken(raw: string): Token | null {
        try {
            return this.tokenProvider.parse(raw);
        } catch {
            return null;
        }
    }
}
