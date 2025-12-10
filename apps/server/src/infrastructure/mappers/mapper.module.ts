import {Global, Module} from '@nestjs/common';
import {AppointmentMapper} from './appointment.mapper';
import {PatientMapper} from './patient.mapper';
import {PersonMapper} from './person.mapper';
import {ProfessionalMapper} from './professional.mapper';
import {RecordMapper} from './record.mapper';

@Global()
@Module({
    providers: [
        PersonMapper,
        ProfessionalMapper,
        PatientMapper,
        RecordMapper,
        AppointmentMapper,
    ],
    exports: [
        PersonMapper,
        ProfessionalMapper,
        PatientMapper,
        RecordMapper,
        AppointmentMapper,
    ],
})
export class MapperModule {}
