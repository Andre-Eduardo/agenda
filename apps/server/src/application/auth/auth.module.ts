import {Module} from '@nestjs/common';
import {AuthController} from '@application/auth/controllers';
import {
    RequestPasswordResetService,
    ResetPasswordService,
    SignInService,
    SignOutService,
} from '@application/auth/services';
import {PasswordResetMailer} from '@domain/user/password-reset-mailer';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {SesPasswordResetMailer} from '@infrastructure/notification/ses-password-reset.mailer';

@Module({
    imports: [InfrastructureModule],
    controllers: [AuthController],
    providers: [
        SignInService,
        SignOutService,
        RequestPasswordResetService,
        ResetPasswordService,
        {provide: PasswordResetMailer, useClass: SesPasswordResetMailer},
    ],
})
export class AuthModule {}
