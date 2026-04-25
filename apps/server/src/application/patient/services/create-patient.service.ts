import {Injectable} from '@nestjs/common';
import {Patient} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PersonType} from '../../../domain/person/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreatePatientDto, PatientDto} from '../dtos';

@Injectable()
export class CreatePatientService implements ApplicationService<CreatePatientDto, PatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<CreatePatientDto>): Promise<PatientDto> {
        // Tenant boundary: prefer the clinicId injected from the cookie via the
        // request-context middleware; only fall back to the actor's clinicId if
        // the request didn't carry one (this happens with @BypassClinicMember
        // routes, which shouldn't reach this service in practice).
        const clinicId = payload.clinicId ?? actor.clinicId;

        const patient = Patient.create({
            ...payload,
            clinicId,
            phone: payload.phone ?? null,
            gender: payload.gender ?? null,
            personType: payload.personType ?? PersonType.NATURAL,
            birthDate: payload.birthDate ?? null,
            email: payload.email ?? null,
            emergencyContactName: payload.emergencyContactName ?? null,
            emergencyContactPhone: payload.emergencyContactPhone ?? null,
        });

        // PatientPrismaRepository persists Person + Patient atomically in a
        // transaction, so a separate personRepository.save() is no longer needed.
        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
