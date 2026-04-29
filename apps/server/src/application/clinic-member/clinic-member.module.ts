import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { ClinicMemberController } from "@application/clinic-member/controllers/clinic-member.controller";
import {
  CreateClinicMemberService,
  ListClinicMembersService,
} from "@application/clinic-member/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [ClinicMemberController],
  providers: [CreateClinicMemberService, ListClinicMembersService],
})
export class ClinicMemberModule {}
