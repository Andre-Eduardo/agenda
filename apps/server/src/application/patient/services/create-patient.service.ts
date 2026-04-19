import {Injectable} from '@nestjs/common';
import {Patient} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PersonProfile, PersonType} from '../../../domain/person/entities';
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
        const patient = Patient.create({
            ...payload,
            phone: payload.phone ?? null,
            gender: payload.gender ?? null,
            personType: payload.personType ?? PersonType.NATURAL,
            profiles: new Set([PersonProfile.PATIENT]),
            professionalId: payload.professionalId ?? null,
            birthDate: payload.birthDate ?? null,
            email: payload.email ?? null,
            emergencyContactName: payload.emergencyContactName ?? null,
            emergencyContactPhone: payload.emergencyContactPhone ?? null,
        });

        await this.personRepository.save(patient);
        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
