import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AgentProposalController } from "@application/agent-proposal/controllers/agent-proposal.controller";
import { ExpireOldProposalsJob } from "@application/agent-proposal/jobs/expire-old-proposals.job";
import { CreateAppointmentProposalService } from "@application/agent-proposal/services/create-appointment-proposal.service";
import { CreateAppointmentCancelProposalService } from "@application/agent-proposal/services/create-appointment-cancel-proposal.service";
import { CreateAppointmentRescheduleProposalService } from "@application/agent-proposal/services/create-appointment-reschedule-proposal.service";
import { CreatePatientAlertProposalService } from "@application/agent-proposal/services/create-patient-alert-proposal.service";
import { ConfirmProposalService } from "@application/agent-proposal/services/confirm-proposal.service";
import { RejectProposalService } from "@application/agent-proposal/services/reject-proposal.service";
import { ListPendingProposalsService } from "@application/agent-proposal/services/list-pending-proposals.service";

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
    ExpireOldProposalsJob,
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
