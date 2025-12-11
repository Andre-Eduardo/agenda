import {Module, Provider} from '@nestjs/common';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {EventRepository} from '../../../domain/event/event.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PersonRepository} from '../../../domain/person/person.repository';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {UserRepository} from '../../../domain/user/user.repository';
import {MapperModule} from '../../mappers';
import {AppointmentPrismaRepository} from '../appointment.prisma.repository';
import {EventPrismaRepository} from '../event.prisma.repository';
import {PatientPrismaRepository} from '../patient.prisma.repository';
import {PersonPrismaRepository} from '../person.prisma.repository';
import {ProfessionalPrismaRepository} from '../professional.prisma.repository';
import {RecordPrismaRepository} from '../record.prisma.repository';
import {UserPrismaRepository} from '../user.prisma.repository';
import {PrismaService} from '.';

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
];

@Module({
    imports: [MapperModule],
    providers: [PrismaService, ...repositories],
    exports: repositories,
})
export class RepositoryModule {}
