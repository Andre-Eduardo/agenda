import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { UserController } from "@application/user/controllers";
import {
  ChangeUserPasswordService,
  DeleteUserService,
  GetUserService,
  SignUpUserService,
  UpdateUserService,
} from "@application/user/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [UserController],
  providers: [
    SignUpUserService,
    GetUserService,
    UpdateUserService,
    ChangeUserPasswordService,
    DeleteUserService,
  ],
})
export class UserModule {}
