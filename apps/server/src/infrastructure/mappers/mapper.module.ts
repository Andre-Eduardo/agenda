import {Global, Module} from '@nestjs/common';
import {AppointmentMapper} from './appointment.mapper';
import {EventMapper} from './event.mapper';
import {PatientMapper} from './patient.mapper';
import {PersonMapper} from './person.mapper';
import {ProfessionalMapper} from './professional.mapper';
import {RecordMapper} from './record.mapper';
import {WorkingHoursMapper} from './working-hours.mapper';
import {ProfessionalBlockMapper} from './professional-block.mapper';

const mappers = [
    PersonMapper,
    ProfessionalMapper,
    PatientMapper,
    RecordMapper,
    AppointmentMapper,
    EventMapper,
    WorkingHoursMapper,
    ProfessionalBlockMapper,
];

@Global()
@Module({
    providers: mappers,
    exports: mappers,
})
export class MapperModule {}
