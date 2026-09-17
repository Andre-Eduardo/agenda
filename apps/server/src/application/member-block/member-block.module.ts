import {Module} from '@nestjs/common';
import {MemberBlockController} from '@application/member-block/controllers/member-block.controller';
import {
    CreateMemberBlockService,
    DeleteMemberBlockService,
    ListMemberBlocksService,
} from '@application/member-block/services';
import {ProfessionalAgendaAccessModule} from '@application/professional-agenda-access/professional-agenda-access.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ProfessionalAgendaAccessModule],
    controllers: [MemberBlockController],
    providers: [CreateMemberBlockService, ListMemberBlocksService, DeleteMemberBlockService],
})
export class MemberBlockModule {}
