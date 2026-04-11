import {Global, Module} from '@nestjs/common';
import {AppointmentMapper} from './appointment.mapper';
import {ClinicalProfileMapper} from './clinical-profile.mapper';
import {EventMapper} from './event.mapper';
import {PatientMapper} from './patient.mapper';
import {PatientAlertMapper} from './patient-alert.mapper';
import {PersonMapper} from './person.mapper';
import {ProfessionalMapper} from './professional.mapper';
import {RecordMapper} from './record.mapper';
import {WorkingHoursMapper} from './working-hours.mapper';
import {ProfessionalBlockMapper} from './professional-block.mapper';
import {FormTemplateMapper} from './form-template.mapper';
import {FormTemplateVersionMapper} from './form-template-version.mapper';
import {PatientFormMapper} from './patient-form.mapper';
import {FormFieldIndexMapper} from './form-field-index.mapper';
import {AiAgentProfileMapper} from './ai-agent-profile.mapper';
import {PatientChatSessionMapper} from './patient-chat-session.mapper';
import {PatientChatMessageMapper} from './patient-chat-message.mapper';
import {PatientContextSnapshotMapper} from './patient-context-snapshot.mapper';
import {PatientContextChunkMapper} from './patient-context-chunk.mapper';
import {ClinicalChatInteractionLogMapper} from './clinical-chat-interaction-log.mapper';

const mappers = [
    PersonMapper,
    ProfessionalMapper,
    PatientMapper,
    RecordMapper,
    AppointmentMapper,
    EventMapper,
    WorkingHoursMapper,
    ProfessionalBlockMapper,
    ClinicalProfileMapper,
    PatientAlertMapper,
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
];

@Global()
@Module({
    providers: mappers,
    exports: mappers,
})
export class MapperModule {}
