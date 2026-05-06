import {Module} from '@nestjs/common';
import {AuthController} from '@application/auth/controllers';
import {SignInService, SignOutService} from '@application/auth/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AuthController],
    providers: [SignInService, SignOutService],
})
export class AuthModule {}
