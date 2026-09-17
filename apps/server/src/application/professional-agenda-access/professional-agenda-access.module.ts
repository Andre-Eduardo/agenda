import {Module} from '@nestjs/common';
import {ProfessionalAgendaAccessController} from '@application/professional-agenda-access/controllers/professional-agenda-access.controller';
import {
    AgendaAccessChecker,
    GrantProfessionalAgendaAccessService,
    ListManageableAgendasService,
    ListProfessionalAgendaAccessService,
    RevokeProfessionalAgendaAccessService,
} from '@application/professional-agenda-access/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ProfessionalAgendaAccessController],
    providers: [
        GrantProfessionalAgendaAccessService,
        ListManageableAgendasService,
        ListProfessionalAgendaAccessService,
        RevokeProfessionalAgendaAccessService,
        AgendaAccessChecker,
    ],
    exports: [AgendaAccessChecker, ListManageableAgendasService],
})
export class ProfessionalAgendaAccessModule {}
