import {Injectable, Logger} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {RequestPasswordResetDto} from '@application/auth/dtos';
import {UnauthenticatedActor} from '@domain/@shared/actor';
import {PasswordResetMailer} from '@domain/user/password-reset-mailer';
import {TokenProvider, TokenScope} from '@domain/user/token';
import {UserRepository} from '@domain/user/user.repository';
import {EnvConfigService} from '@infrastructure/config';

/** Token metadata key holding the password fingerprint that makes the link single-use. */
export const PASSWORD_FINGERPRINT_CLAIM = 'pwd';

/**
 * Starts the "forgot my password" flow: e-mails a short-lived link with a RECOVERY token.
 *
 * Always resolves the same way, whether or not the e-mail belongs to an account, so the endpoint
 * cannot be used to discover registered addresses.
 */
@Injectable()
export class RequestPasswordResetService implements ApplicationService<
    RequestPasswordResetDto,
    void,
    UnauthenticatedActor
> {
    private readonly logger = new Logger(RequestPasswordResetService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenProvider: TokenProvider,
        private readonly mailer: PasswordResetMailer,
        private readonly config: EnvConfigService
    ) {}

    async execute({payload}: Command<RequestPasswordResetDto, UnauthenticatedActor>): Promise<void> {
        const user = await this.userRepository.findByEmail(payload.email);

        if (user === null || user.email === null) {
            this.logger.log('Password reset requested for an unknown e-mail; nothing sent.');

            return;
        }

        const {tokenExpiration, webAppUrl} = this.config.passwordReset;

        const token = await this.tokenProvider.issue(user.id, {
            scope: [TokenScope.RECOVERY],
            expiration: tokenExpiration,
            metadata: {[PASSWORD_FINGERPRINT_CLAIM]: user.password.fingerprint()},
        });

        const resetUrl = new URL('/auth/reset-password', webAppUrl);

        resetUrl.searchParams.set('token', token.toString());

        await this.mailer.send({
            to: user.email.toString(),
            name: user.name,
            resetUrl: resetUrl.toString(),
            expiresInMinutes: Math.round(tokenExpiration / 60),
        });
    }
}
