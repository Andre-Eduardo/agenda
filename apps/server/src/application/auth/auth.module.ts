import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AuthController } from "@application/auth/controllers";
import { SignInService, SignOutService } from "@application/auth/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [AuthController],
  providers: [SignInService, SignOutService],
})
export class AuthModule {}
