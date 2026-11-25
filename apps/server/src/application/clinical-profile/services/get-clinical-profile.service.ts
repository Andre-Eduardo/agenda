import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ClinicalProfileDto, GetClinicalProfileDto} from '@application/clinical-profile/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicalProfileRepository} from '@domain/clinical-profile/clinical-profile.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class GetClinicalProfileService implements ApplicationService<GetClinicalProfileDto, ClinicalProfileDto | null> {
    constructor(
        private readonly clinicalProfileRepository: ClinicalProfileRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<GetClinicalProfileDto>): Promise<ClinicalProfileDto | null> {
        const patient = await this.patientRepository.findById(payload.patientId);

        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'read');

        const profile = await this.clinicalProfileRepository.findByPatientId(payload.patientId);

        if (profile === null) return null;

        assertEntityBelongsToClinic(profile.clinicId, actor.clinicId);

        return new ClinicalProfileDto(profile);
    }
}
