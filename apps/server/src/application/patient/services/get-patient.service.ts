import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {GetPatientDto, PatientDto} from '@application/patient/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class GetPatientService implements ApplicationService<GetPatientDto, PatientDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly patientRepository: PatientRepository
    ) {}

    async execute({actor, payload}: Command<GetPatientDto>): Promise<PatientDto> {
        const patient = await this.patientRepository.findById(payload.id);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        const clinicalAccess = await this.patientAccessChecker.clinicalAccessForPatient(actor, payload.id);

        return new PatientDto(patient, clinicalAccess);
    }
}
