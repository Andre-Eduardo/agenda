import {Module} from '@nestjs/common';
import {AgentProposalModule} from '@application/agent-proposal/agent-proposal.module';
import {AgentAskController} from '@application/agent/controllers/agent-ask.controller';
import {AgentMetricsController} from '@application/agent/controllers/agent-metrics.controller';
import {AgentLoopService} from '@application/agent/core/agent-loop.service';
import {ToolDispatcherService} from '@application/agent/core/tool-dispatcher.service';
import {ToolRegistryService} from '@application/agent/core/tool-registry.service';
import {AGENT_TOOL_TOKEN} from '@application/agent/interfaces';
import {GetAgentMetricsService} from '@application/agent/services/get-agent-metrics.service';
import {CheckScheduleConflictsTool} from '@application/agent/tools/agenda/check-schedule-conflicts.tool';
import {GetAppointmentTool} from '@application/agent/tools/agenda/get-appointment.tool';
// Agenda tools
import {ListAppointmentsTool} from '@application/agent/tools/agenda/list-appointments.tool';
import {ListPatientAppointmentsTool} from '@application/agent/tools/agenda/list-patient-appointments.tool';
// Form-data tools
import {GetPatientFormTool} from '@application/agent/tools/form-data/get-patient-form.tool';
import {ListPatientFormsTool} from '@application/agent/tools/form-data/list-patient-forms.tool';
// Knowledge tools
import {SearchKnowledgeTool} from '@application/agent/tools/knowledge/search-knowledge.tool';
import {DraftRecordEvolutionTool} from '@application/agent/tools/mutations/draft-record-evolution.tool';
// Mutation tools
import {ProposeAppointmentTool} from '@application/agent/tools/mutations/propose-appointment.tool';
import {ProposeCancelAppointmentTool} from '@application/agent/tools/mutations/propose-cancel-appointment.tool';
import {ProposePatientAlertTool} from '@application/agent/tools/mutations/propose-patient-alert.tool';
import {ProposeRescheduleAppointmentTool} from '@application/agent/tools/mutations/propose-reschedule-appointment.tool';
import {GetPatientProfileTool} from '@application/agent/tools/patient/get-patient-profile.tool';
// Patient tools
import {GetPatientTool} from '@application/agent/tools/patient/get-patient.tool';
import {SearchPatientsTool} from '@application/agent/tools/patient/search-patients.tool';
// Record tools
import {GetRecordTool} from '@application/agent/tools/record/get-record.tool';
import {ListPatientRecordsTool} from '@application/agent/tools/record/list-patient-records.tool';
import {BuildPatientContextService} from '@application/clinical-chat/services/build-patient-context.service';
// Snapshot pipeline needed by GetPatientProfileTool
import {GetContextSnapshotService} from '@application/clinical-chat/services/get-context-snapshot.service';
import {IndexPatientChunksService} from '@application/clinical-chat/services/index-patient-chunks.service';
import {KnowledgeBaseModule} from '@application/knowledge-base/knowledge-base.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

const toolClasses = [
    ListAppointmentsTool,
    GetAppointmentTool,
    ListPatientAppointmentsTool,
    CheckScheduleConflictsTool,
    GetPatientTool,
    SearchPatientsTool,
    GetPatientProfileTool,
    GetRecordTool,
    ListPatientRecordsTool,
    GetPatientFormTool,
    ListPatientFormsTool,
    SearchKnowledgeTool,
    ProposeAppointmentTool,
    ProposeCancelAppointmentTool,
    ProposeRescheduleAppointmentTool,
    DraftRecordEvolutionTool,
    ProposePatientAlertTool,
];

const toolMultiProviders = toolClasses.map((cls) => ({
    provide: AGENT_TOOL_TOKEN,
    useClass: cls,
}));

@Module({
    imports: [InfrastructureModule, KnowledgeBaseModule, AgentProposalModule],
    controllers: [AgentAskController, AgentMetricsController],
    providers: [
        ToolRegistryService,
        ToolDispatcherService,
        AgentLoopService,
        GetAgentMetricsService,
        // Snapshot pipeline (stateless — safe to register here alongside ClinicalChatModule)
        GetContextSnapshotService,
        BuildPatientContextService,
        IndexPatientChunksService,
        // Tool instances (class providers)
        ...toolClasses,
        // Multi-injection tokens (for ToolRegistryService discovery)
        ...toolMultiProviders,
    ],
    exports: [AgentLoopService, ToolRegistryService],
})
export class AgentModule {}
