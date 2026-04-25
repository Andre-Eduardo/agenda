import {Global, Module} from '@nestjs/common';
import {AgentProposalMapper} from './agent-proposal.mapper';
import {AiAgentProfileMapper} from './ai-agent-profile.mapper';
import {AppointmentMapper} from './appointment.mapper';
import {ClinicMapper} from './clinic.mapper';
import {ClinicMemberMapper} from './clinic-member.mapper';
import {InsurancePlanMapper} from './insurance-plan.mapper';
import {ClinicPatientAccessMapper} from './clinic-patient-access.mapper';
import {ClinicalChatInteractionLogMapper} from './clinical-chat-interaction-log.mapper';
import {ClinicalProfileMapper} from './clinical-profile.mapper';
import {DocumentPermissionMapper} from './document-permission.mapper';
import {EventMapper} from './event.mapper';
import {FormFieldIndexMapper} from './form-field-index.mapper';
import {FormTemplateMapper} from './form-template.mapper';
import {FormTemplateVersionMapper} from './form-template-version.mapper';
import {KnowledgeChunkMapper} from './knowledge-chunk.mapper';
import {MemberBlockMapper} from './member-block.mapper';
import {PatientMapper} from './patient.mapper';
import {PatientAlertMapper} from './patient-alert.mapper';
import {PatientChatMessageMapper} from './patient-chat-message.mapper';
import {PatientChatSessionMapper} from './patient-chat-session.mapper';
import {PatientContextChunkMapper} from './patient-context-chunk.mapper';
import {PatientContextSnapshotMapper} from './patient-context-snapshot.mapper';
import {PatientFormMapper} from './patient-form.mapper';
import {PersonMapper} from './person.mapper';
import {ProfessionalMapper} from './professional.mapper';
import {RecordMapper} from './record.mapper';
import {WorkingHoursMapper} from './working-hours.mapper';

const mappers = [
    // Tenancy
    ClinicMapper,
    ClinicMemberMapper,
    ClinicPatientAccessMapper,
    DocumentPermissionMapper,
    // People
    PersonMapper,
    ProfessionalMapper,
    PatientMapper,
    InsurancePlanMapper,
    // Schedule
    AppointmentMapper,
    WorkingHoursMapper,
    MemberBlockMapper,
    // Clinical
    RecordMapper,
    ClinicalProfileMapper,
    PatientAlertMapper,
    // Forms
    FormTemplateMapper,
    FormTemplateVersionMapper,
    PatientFormMapper,
    FormFieldIndexMapper,
    // Clinical Chat & RAG
    AiAgentProfileMapper,
    PatientChatSessionMapper,
    PatientChatMessageMapper,
    PatientContextSnapshotMapper,
    PatientContextChunkMapper,
    ClinicalChatInteractionLogMapper,
    KnowledgeChunkMapper,
    // Agent Proposal
    AgentProposalMapper,
    // Misc
    EventMapper,
];

@Global()
@Module({
    providers: mappers,
    exports: mappers,
})
export class MapperModule {}
