import {Module, Provider} from '@nestjs/common';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {ClinicalProfileRepository} from '../../../domain/clinical-profile/clinical-profile.repository';
import {EventRepository} from '../../../domain/event/event.repository';
import {UploadFileRepository} from '../../../domain/file/upload-file.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PersonRepository} from '../../../domain/person/person.repository';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {ProfessionalBlockRepository} from '../../../domain/professional/professional-block.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {UserRepository} from '../../../domain/user/user.repository';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormFieldIndexRepository} from '../../../domain/form-field-index/form-field-index.repository';
import {MapperModule} from '../../mappers';
import {AppointmentPrismaRepository} from '../appointment.prisma.repository';
import {ClinicalProfilePrismaRepository} from '../clinical-profile.prisma.repository';
import {EventPrismaRepository} from '../event.prisma.repository';
import {PatientPrismaRepository} from '../patient.prisma.repository';
import {PatientAlertPrismaRepository} from '../patient-alert.prisma.repository';
import {PersonPrismaRepository} from '../person.prisma.repository';
import {ProfessionalPrismaRepository} from '../professional.prisma.repository';
import {WorkingHoursPrismaRepository} from '../working-hours.prisma.repository';
import {ProfessionalBlockPrismaRepository} from '../professional-block.prisma.repository';
import {RecordPrismaRepository} from '../record.prisma.repository';
import {UploadFilePrismaRepository} from '../upload-file.prisma.repository';
import {UserPrismaRepository} from '../user.prisma.repository';
import {FormTemplatePrismaRepository} from '../form-template.prisma.repository';
import {FormTemplateVersionPrismaRepository} from '../form-template-version.prisma.repository';
import {PatientFormPrismaRepository} from '../patient-form.prisma.repository';
import {FormFieldIndexPrismaRepository} from '../form-field-index.prisma.repository';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {PatientChatMessageRepository} from '../../../domain/clinical-chat/patient-chat-message.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {PatientContextChunkRepository} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {AiAgentProfilePrismaRepository} from '../ai-agent-profile.prisma.repository';
import {PatientChatSessionPrismaRepository} from '../patient-chat-session.prisma.repository';
import {PatientChatMessagePrismaRepository} from '../patient-chat-message.prisma.repository';
import {PatientContextSnapshotPrismaRepository} from '../patient-context-snapshot.prisma.repository';
import {PatientContextChunkPrismaRepository} from '../patient-context-chunk.prisma.repository';
import {PrismaService} from '.';
import {PrismaProvider} from './prisma.provider';

const repositories: Provider[] = [
    {
        provide: EventRepository,
        useClass: EventPrismaRepository,
    },
    {
        provide: UserRepository,
        useClass: UserPrismaRepository,
    },
    {
        provide: PersonRepository,
        useClass: PersonPrismaRepository,
    },
    {
        provide: ProfessionalRepository,
        useClass: ProfessionalPrismaRepository,
    },
    {
        provide: PatientRepository,
        useClass: PatientPrismaRepository,
    },
    {
        provide: AppointmentRepository,
        useClass: AppointmentPrismaRepository,
    },
    {
        provide: RecordRepository,
        useClass: RecordPrismaRepository,
    },
    {
        provide: UploadFileRepository,
        useClass: UploadFilePrismaRepository,
    },
    {
        provide: WorkingHoursRepository,
        useClass: WorkingHoursPrismaRepository,
    },
    {
        provide: ProfessionalBlockRepository,
        useClass: ProfessionalBlockPrismaRepository,
    },
    {
        provide: ClinicalProfileRepository,
        useClass: ClinicalProfilePrismaRepository,
    },
    {
        provide: PatientAlertRepository,
        useClass: PatientAlertPrismaRepository,
    },
    {
        provide: FormTemplateRepository,
        useClass: FormTemplatePrismaRepository,
    },
    {
        provide: FormTemplateVersionRepository,
        useClass: FormTemplateVersionPrismaRepository,
    },
    {
        provide: PatientFormRepository,
        useClass: PatientFormPrismaRepository,
    },
    {
        provide: FormFieldIndexRepository,
        useClass: FormFieldIndexPrismaRepository,
    },
    // Clinical Chat & RAG
    {
        provide: AiAgentProfileRepository,
        useClass: AiAgentProfilePrismaRepository,
    },
    {
        provide: PatientChatSessionRepository,
        useClass: PatientChatSessionPrismaRepository,
    },
    {
        provide: PatientChatMessageRepository,
        useClass: PatientChatMessagePrismaRepository,
    },
    {
        provide: PatientContextSnapshotRepository,
        useClass: PatientContextSnapshotPrismaRepository,
    },
    {
        provide: PatientContextChunkRepository,
        useClass: PatientContextChunkPrismaRepository,
    },
];

@Module({
    imports: [MapperModule],
    providers: [PrismaService, PrismaProvider, ...repositories],
    exports: [PrismaProvider, ...repositories],
})
export class RepositoryModule {}
