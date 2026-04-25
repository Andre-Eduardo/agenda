import {Module, Provider} from '@nestjs/common';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {AppointmentReminderRepository} from '../../../domain/appointment-reminder/appointment-reminder.repository';
import {ClinicReminderConfigRepository} from '../../../domain/clinic-reminder-config/clinic-reminder-config.repository';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {ClinicalChatInteractionLogRepository} from '../../../domain/clinical-chat/clinical-chat-interaction-log.repository';
import {PatientChatMessageRepository} from '../../../domain/clinical-chat/patient-chat-message.repository';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {PatientContextChunkRepository} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {ClinicRepository} from '../../../domain/clinic/clinic.repository';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {ClinicPatientAccessRepository} from '../../../domain/clinic-patient-access/clinic-patient-access.repository';
import {ClinicalProfileRepository} from '../../../domain/clinical-profile/clinical-profile.repository';
import {DocumentPermissionRepository} from '../../../domain/document-permission/document-permission.repository';
import {EventRepository} from '../../../domain/event/event.repository';
import {UploadFileRepository} from '../../../domain/file/upload-file.repository';
import {FormFieldIndexRepository} from '../../../domain/form-field-index/form-field-index.repository';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {KnowledgeChunkRepository} from '../../../domain/knowledge-base/knowledge-chunk.repository';
import {InsurancePlanRepository} from '../../../domain/insurance-plan/insurance-plan.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {PersonRepository} from '../../../domain/person/person.repository';
import {MemberBlockRepository} from '../../../domain/professional/member-block.repository';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {UserRepository} from '../../../domain/user/user.repository';
import {MapperModule} from '../../mappers';
import {AgentProposalPrismaRepository} from '../agent-proposal.prisma.repository';
import {AiAgentProfilePrismaRepository} from '../ai-agent-profile.prisma.repository';
import {AppointmentPrismaRepository} from '../appointment.prisma.repository';
import {AppointmentReminderPrismaRepository} from '../appointment-reminder.prisma.repository';
import {ClinicReminderConfigPrismaRepository} from '../clinic-reminder-config.prisma.repository';
import {ClinicalChatInteractionLogPrismaRepository} from '../clinical-chat-interaction-log.prisma.repository';
import {ClinicalProfilePrismaRepository} from '../clinical-profile.prisma.repository';
import {ClinicMemberPrismaRepository} from '../clinic-member.prisma.repository';
import {ClinicPatientAccessPrismaRepository} from '../clinic-patient-access.prisma.repository';
import {ClinicPrismaRepository} from '../clinic.prisma.repository';
import {DocumentPermissionPrismaRepository} from '../document-permission.prisma.repository';
import {EventPrismaRepository} from '../event.prisma.repository';
import {FormFieldIndexPrismaRepository} from '../form-field-index.prisma.repository';
import {FormTemplatePrismaRepository} from '../form-template.prisma.repository';
import {FormTemplateVersionPrismaRepository} from '../form-template-version.prisma.repository';
import {KnowledgeChunkPrismaRepository} from '../knowledge-chunk.prisma.repository';
import {MemberBlockPrismaRepository} from '../member-block.prisma.repository';
import {InsurancePlanPrismaRepository} from '../insurance-plan.prisma.repository';
import {PatientPrismaRepository} from '../patient.prisma.repository';
import {PatientAlertPrismaRepository} from '../patient-alert.prisma.repository';
import {PatientChatMessagePrismaRepository} from '../patient-chat-message.prisma.repository';
import {PatientChatSessionPrismaRepository} from '../patient-chat-session.prisma.repository';
import {PatientContextChunkPrismaRepository} from '../patient-context-chunk.prisma.repository';
import {PatientContextSnapshotPrismaRepository} from '../patient-context-snapshot.prisma.repository';
import {PatientFormPrismaRepository} from '../patient-form.prisma.repository';
import {PersonPrismaRepository} from '../person.prisma.repository';
import {ProfessionalPrismaRepository} from '../professional.prisma.repository';
import {RecordPrismaRepository} from '../record.prisma.repository';
import {UploadFilePrismaRepository} from '../upload-file.prisma.repository';
import {UserPrismaRepository} from '../user.prisma.repository';
import {WorkingHoursPrismaRepository} from '../working-hours.prisma.repository';
import {PrismaService} from '.';
import {PrismaProvider} from './prisma.provider';

const repositories: Provider[] = [
    // Tenancy
    {provide: ClinicRepository, useClass: ClinicPrismaRepository},
    {provide: ClinicMemberRepository, useClass: ClinicMemberPrismaRepository},
    {provide: ClinicPatientAccessRepository, useClass: ClinicPatientAccessPrismaRepository},
    {provide: DocumentPermissionRepository, useClass: DocumentPermissionPrismaRepository},
    // Misc
    {provide: EventRepository, useClass: EventPrismaRepository},
    {provide: UserRepository, useClass: UserPrismaRepository},
    {provide: PersonRepository, useClass: PersonPrismaRepository},
    // People
    {provide: ProfessionalRepository, useClass: ProfessionalPrismaRepository},
    {provide: PatientRepository, useClass: PatientPrismaRepository},
    {provide: InsurancePlanRepository, useClass: InsurancePlanPrismaRepository},
    // Schedule
    {provide: AppointmentRepository, useClass: AppointmentPrismaRepository},
    {provide: AppointmentReminderRepository, useClass: AppointmentReminderPrismaRepository},
    {provide: ClinicReminderConfigRepository, useClass: ClinicReminderConfigPrismaRepository},
    {provide: WorkingHoursRepository, useClass: WorkingHoursPrismaRepository},
    {provide: MemberBlockRepository, useClass: MemberBlockPrismaRepository},
    // Clinical
    {provide: RecordRepository, useClass: RecordPrismaRepository},
    {provide: UploadFileRepository, useClass: UploadFilePrismaRepository},
    {provide: ClinicalProfileRepository, useClass: ClinicalProfilePrismaRepository},
    {provide: PatientAlertRepository, useClass: PatientAlertPrismaRepository},
    // Forms
    {provide: FormTemplateRepository, useClass: FormTemplatePrismaRepository},
    {provide: FormTemplateVersionRepository, useClass: FormTemplateVersionPrismaRepository},
    {provide: PatientFormRepository, useClass: PatientFormPrismaRepository},
    {provide: FormFieldIndexRepository, useClass: FormFieldIndexPrismaRepository},
    // Clinical Chat & RAG
    {provide: AiAgentProfileRepository, useClass: AiAgentProfilePrismaRepository},
    {provide: PatientChatSessionRepository, useClass: PatientChatSessionPrismaRepository},
    {provide: PatientChatMessageRepository, useClass: PatientChatMessagePrismaRepository},
    {provide: PatientContextSnapshotRepository, useClass: PatientContextSnapshotPrismaRepository},
    {provide: PatientContextChunkRepository, useClass: PatientContextChunkPrismaRepository},
    {provide: ClinicalChatInteractionLogRepository, useClass: ClinicalChatInteractionLogPrismaRepository},
    // Knowledge Base
    {provide: KnowledgeChunkRepository, useClass: KnowledgeChunkPrismaRepository},
    // Agent Proposal
    {provide: AgentProposalRepository, useClass: AgentProposalPrismaRepository},
];

@Module({
    imports: [MapperModule],
    providers: [PrismaService, PrismaProvider, ...repositories],
    exports: [PrismaProvider, ...repositories],
})
export class RepositoryModule {}
