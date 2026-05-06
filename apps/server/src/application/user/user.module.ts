import {Module} from '@nestjs/common';
import {UserController} from '@application/user/controllers';
import {
    ChangeUserPasswordService,
    DeleteUserService,
    GetUserService,
    SignUpUserService,
    UpdateUserService,
} from '@application/user/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [UserController],
    providers: [SignUpUserService, GetUserService, UpdateUserService, ChangeUserPasswordService, DeleteUserService],
})
export class UserModule {}
