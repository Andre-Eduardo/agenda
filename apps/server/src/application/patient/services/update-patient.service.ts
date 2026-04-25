import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientDto, UpdatePatientDto} from '../dtos';

@Injectable()
export class UpdatePatientService implements ApplicationService<UpdatePatientDto, PatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdatePatientDto>): Promise<PatientDto> {
        const patient = await this.patientRepository.findById(id);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', id.toString());
        }

        patient.change({
            name: props.name,
            phone: props.phone ?? undefined,
            gender: props.gender ?? undefined,
            birthDate: props.birthDate ?? undefined,
            email: props.email ?? undefined,
            emergencyContactName: props.emergencyContactName ?? undefined,
            emergencyContactPhone: props.emergencyContactPhone ?? undefined,
            address: props.address !== undefined
                ? props.address
                    ? {
                          street: props.address.street ?? null,
                          number: props.address.number ?? null,
                          complement: props.address.complement ?? null,
                          neighborhood: props.address.neighborhood ?? null,
                          city: props.address.city ?? null,
                          state: props.address.state ?? null,
                          zipCode: props.address.zipCode ?? null,
                          country: props.address.country ?? null,
                      }
                    : null
                : undefined,
            insurancePlanId: props.insurancePlanId !== undefined ? (props.insurancePlanId ?? null) : undefined,
            insuranceCardNumber: props.insuranceCardNumber !== undefined ? (props.insuranceCardNumber ?? null) : undefined,
            insuranceValidUntil: props.insuranceValidUntil !== undefined ? (props.insuranceValidUntil ?? null) : undefined,
        });

        await this.patientRepository.save(patient);

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
