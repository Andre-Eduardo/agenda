import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AuthController} from './controllers';
import {SignInService, SignOutService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [AuthController],
    providers: [SignInService, SignOutService],
})
export class AuthModule {}
