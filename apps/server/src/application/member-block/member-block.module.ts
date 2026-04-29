import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { MemberBlockController } from "@application/member-block/controllers/member-block.controller";
import {
  CreateMemberBlockService,
  DeleteMemberBlockService,
  ListMemberBlocksService,
} from "@application/member-block/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [MemberBlockController],
  providers: [CreateMemberBlockService, ListMemberBlocksService, DeleteMemberBlockService],
})
export class MemberBlockModule {}
