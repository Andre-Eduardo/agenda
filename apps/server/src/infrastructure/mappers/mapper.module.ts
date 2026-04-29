import { Global, Module } from "@nestjs/common";
import { AgentProposalMapper } from "@infrastructure/mappers/agent-proposal.mapper";
import { AppointmentPaymentMapper } from "@infrastructure/mappers/appointment-payment.mapper";
import { ClinicalDocumentMapper } from "@infrastructure/mappers/clinical-document.mapper";
import { ClinicalDocumentTemplateMapper } from "@infrastructure/mappers/clinical-document-template.mapper";
import { AiAgentProfileMapper } from "@infrastructure/mappers/ai-agent-profile.mapper";
import { AppointmentMapper } from "@infrastructure/mappers/appointment.mapper";
import { AppointmentReminderMapper } from "@infrastructure/mappers/appointment-reminder.mapper";
import { ClinicReminderConfigMapper } from "@infrastructure/mappers/clinic-reminder-config.mapper";
import { ClinicMapper } from "@infrastructure/mappers/clinic.mapper";
import { ClinicMemberMapper } from "@infrastructure/mappers/clinic-member.mapper";
import { InsurancePlanMapper } from "@infrastructure/mappers/insurance-plan.mapper";
import { ClinicPatientAccessMapper } from "@infrastructure/mappers/clinic-patient-access.mapper";
import { ClinicalChatInteractionLogMapper } from "@infrastructure/mappers/clinical-chat-interaction-log.mapper";
import { ClinicalProfileMapper } from "@infrastructure/mappers/clinical-profile.mapper";
import { DocumentPermissionMapper } from "@infrastructure/mappers/document-permission.mapper";
import { EventMapper } from "@infrastructure/mappers/event.mapper";
import { FormFieldIndexMapper } from "@infrastructure/mappers/form-field-index.mapper";
import { FormTemplateMapper } from "@infrastructure/mappers/form-template.mapper";
import { FormTemplateVersionMapper } from "@infrastructure/mappers/form-template-version.mapper";
import { KnowledgeChunkMapper } from "@infrastructure/mappers/knowledge-chunk.mapper";
import { MemberBlockMapper } from "@infrastructure/mappers/member-block.mapper";
import { PatientMapper } from "@infrastructure/mappers/patient.mapper";
import { PatientAlertMapper } from "@infrastructure/mappers/patient-alert.mapper";
import { PatientChatMessageMapper } from "@infrastructure/mappers/patient-chat-message.mapper";
import { PatientChatSessionMapper } from "@infrastructure/mappers/patient-chat-session.mapper";
import { PatientContextChunkMapper } from "@infrastructure/mappers/patient-context-chunk.mapper";
import { PatientContextSnapshotMapper } from "@infrastructure/mappers/patient-context-snapshot.mapper";
import { PatientFormMapper } from "@infrastructure/mappers/patient-form.mapper";
import { PersonMapper } from "@infrastructure/mappers/person.mapper";
import { ProfessionalMapper } from "@infrastructure/mappers/professional.mapper";
import { DraftEvolutionMapper } from "@infrastructure/mappers/draft-evolution.mapper";
import { ImportedDocumentMapper } from "@infrastructure/mappers/imported-document.mapper";
import { RecordAmendmentMapper } from "@infrastructure/mappers/record-amendment.mapper";
import { RecordMapper } from "@infrastructure/mappers/record.mapper";
import { WorkingHoursMapper } from "@infrastructure/mappers/working-hours.mapper";

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
