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
];

@Global()
@Module({
    providers: mappers,
    exports: mappers,
})
export class MapperModule {}
