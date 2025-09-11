import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {UserController} from './controllers';
import {
    ChangeUserPasswordService,
    DeleteUserService,
    GetUserService,
    SignUpUserService,
    UpdateUserService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [UserController],
    providers: [SignUpUserService, GetUserService, UpdateUserService, ChangeUserPasswordService, DeleteUserService],
})
export class UserModule {}
