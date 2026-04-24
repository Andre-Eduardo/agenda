import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {KnowledgeBaseModule} from '../knowledge-base/knowledge-base.module';
import {AgentProposalModule} from '../agent-proposal/agent-proposal.module';
import {AgentAskController} from './controllers/agent-ask.controller';
import {AgentMetricsController} from './controllers/agent-metrics.controller';
import {GetAgentMetricsService} from './services/get-agent-metrics.service';
import {AgentLoopService} from './core/agent-loop.service';
import {ToolDispatcherService} from './core/tool-dispatcher.service';
import {ToolRegistryService} from './core/tool-registry.service';
import {AGENT_TOOL_TOKEN} from './interfaces';
// Agenda tools
import {ListAppointmentsTool} from './tools/agenda/list-appointments.tool';
import {GetAppointmentTool} from './tools/agenda/get-appointment.tool';
import {ListPatientAppointmentsTool} from './tools/agenda/list-patient-appointments.tool';
import {CheckScheduleConflictsTool} from './tools/agenda/check-schedule-conflicts.tool';
// Patient tools
import {GetPatientTool} from './tools/patient/get-patient.tool';
import {SearchPatientsTool} from './tools/patient/search-patients.tool';
import {GetPatientProfileTool} from './tools/patient/get-patient-profile.tool';
// Record tools
import {GetRecordTool} from './tools/record/get-record.tool';
import {ListPatientRecordsTool} from './tools/record/list-patient-records.tool';
// Form-data tools
import {GetPatientFormTool} from './tools/form-data/get-patient-form.tool';
import {ListPatientFormsTool} from './tools/form-data/list-patient-forms.tool';
// Knowledge tools
import {SearchKnowledgeTool} from './tools/knowledge/search-knowledge.tool';
// Mutation tools
import {ProposeAppointmentTool} from './tools/mutations/propose-appointment.tool';
import {ProposeCancelAppointmentTool} from './tools/mutations/propose-cancel-appointment.tool';
import {ProposeRescheduleAppointmentTool} from './tools/mutations/propose-reschedule-appointment.tool';
import {DraftRecordEvolutionTool} from './tools/mutations/draft-record-evolution.tool';
import {ProposePatientAlertTool} from './tools/mutations/propose-patient-alert.tool';
// Snapshot pipeline needed by GetPatientProfileTool
import {GetContextSnapshotService} from '../clinical-chat/services/get-context-snapshot.service';
import {BuildPatientContextService} from '../clinical-chat/services/build-patient-context.service';
import {IndexPatientChunksService} from '../clinical-chat/services/index-patient-chunks.service';

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
