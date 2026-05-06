import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {getPatientSchema} from '@application/patient/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientRepository} from '@domain/patient/patient.repository';

type DeletePatientDto = z.infer<typeof getPatientSchema>;

@Injectable()
export class DeletePatientService implements ApplicationService<DeletePatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeletePatientDto>): Promise<void> {
        const patient = await this.patientRepository.findById(payload.id);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.id.toString());
        }

        patient.delete();

        await this.patientRepository.delete(patient.id);

        this.eventDispatcher.dispatch(actor, patient);
    }
}
