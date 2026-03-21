import {Injectable} from '@nestjs/common';
import {Patient} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PersonRepository} from '../../../domain/person/person.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreatePatientDto, PatientDto} from '../dtos';

@Injectable()
export class CreatePatientService implements ApplicationService<CreatePatientDto, PatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly personRepository: PersonRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePatientDto>): Promise<PatientDto> {
        const patient = Patient.create(payload);

        await this.personRepository.save(patient as any);
        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
