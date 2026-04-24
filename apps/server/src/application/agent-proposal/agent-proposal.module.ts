import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AgentProposalController} from './controllers/agent-proposal.controller';
import {CreateAppointmentProposalService} from './services/create-appointment-proposal.service';
import {CreateAppointmentCancelProposalService} from './services/create-appointment-cancel-proposal.service';
import {CreateAppointmentRescheduleProposalService} from './services/create-appointment-reschedule-proposal.service';
import {CreatePatientAlertProposalService} from './services/create-patient-alert-proposal.service';
import {ConfirmProposalService} from './services/confirm-proposal.service';
import {RejectProposalService} from './services/reject-proposal.service';
import {ListPendingProposalsService} from './services/list-pending-proposals.service';

@Module({
    imports: [InfrastructureModule],
    controllers: [AgentProposalController],
    providers: [
        CreateAppointmentProposalService,
        CreateAppointmentCancelProposalService,
        CreateAppointmentRescheduleProposalService,
        CreatePatientAlertProposalService,
        ConfirmProposalService,
        RejectProposalService,
        ListPendingProposalsService,
    ],
    exports: [
        CreateAppointmentProposalService,
        CreateAppointmentCancelProposalService,
        CreateAppointmentRescheduleProposalService,
        CreatePatientAlertProposalService,
        ConfirmProposalService,
        RejectProposalService,
        ListPendingProposalsService,
    ],
})
export class AgentProposalModule {}
