import {Global, Module} from '@nestjs/common';
import {AgentProposalMapper} from './agent-proposal.mapper';
import {AppointmentPaymentMapper} from './appointment-payment.mapper';
import {ClinicalDocumentMapper} from './clinical-document.mapper';
import {ClinicalDocumentTemplateMapper} from './clinical-document-template.mapper';
import {AiAgentProfileMapper} from './ai-agent-profile.mapper';
import {AppointmentMapper} from './appointment.mapper';
import {AppointmentReminderMapper} from './appointment-reminder.mapper';
import {ClinicReminderConfigMapper} from './clinic-reminder-config.mapper';
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
import {DraftEvolutionMapper} from './draft-evolution.mapper';
import {ImportedDocumentMapper} from './imported-document.mapper';
import {RecordAmendmentMapper} from './record-amendment.mapper';
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
    AppointmentPaymentMapper,
    AppointmentReminderMapper,
    ClinicReminderConfigMapper,
    WorkingHoursMapper,
    MemberBlockMapper,
    // Clinical
    RecordMapper,
    RecordAmendmentMapper,
    ImportedDocumentMapper,
    DraftEvolutionMapper,
    ClinicalProfileMapper,
    PatientAlertMapper,
    ClinicalDocumentMapper,
    ClinicalDocumentTemplateMapper,
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
