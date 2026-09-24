import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {getPatientSchema} from '@application/patient/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

type DeletePatientDto = z.infer<typeof getPatientSchema>;

@Injectable()
export class DeletePatientService implements ApplicationService<DeletePatientDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeletePatientDto>): Promise<void> {
        const patient = await this.patientRepository.findById(payload.id);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, PatientId.from(patient.id.toString()), 'write');

        patient.delete();

        await this.patientRepository.delete(patient.id);

        this.eventDispatcher.dispatch(actor, patient);
    }
}
