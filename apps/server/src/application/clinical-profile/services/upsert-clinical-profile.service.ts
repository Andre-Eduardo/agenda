import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ClinicalProfileDto, UpsertClinicalProfileDto} from '@application/clinical-profile/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicalProfileRepository} from '@domain/clinical-profile/clinical-profile.repository';
import {ClinicalProfile} from '@domain/clinical-profile/entities';
import {EventDispatcher} from '@domain/event';
import {PatientRepository} from '@domain/patient/patient.repository';
import {ProfessionalRepository} from '@domain/professional/professional.repository';

@Injectable()
export class UpsertClinicalProfileService implements ApplicationService<UpsertClinicalProfileDto, ClinicalProfileDto> {
    constructor(
        private readonly clinicalProfileRepository: ClinicalProfileRepository,
        private readonly patientRepository: PatientRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<UpsertClinicalProfileDto>): Promise<ClinicalProfileDto> {
        const patient = await this.patientRepository.findById(payload.patientId);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'write');

        let profile = await this.clinicalProfileRepository.findByPatientIdForUpdate(payload.patientId);

        if (profile === null) {
            const professional = await this.professionalRepository.findById(payload.responsibleProfessionalId);
            const member = professional && (await this.clinicMemberRepository.findById(professional.clinicMemberId));

            if (!member?.isActive) {
                throw new ResourceNotFoundException(
                    'Professional not found.',
                    payload.responsibleProfessionalId.toString()
                );
            }

            assertEntityBelongsToClinic(member.clinicId, actor.clinicId);

            profile = ClinicalProfile.create({
                clinicId: actor.clinicId,
                patientId: payload.patientId,
                createdByMemberId: actor.clinicMemberId,
                responsibleProfessionalId: payload.responsibleProfessionalId,
                allergies: payload.allergies ?? null,
                chronicConditions: payload.chronicConditions ?? null,
                currentMedications: payload.currentMedications ?? null,
                surgicalHistory: payload.surgicalHistory ?? null,
                familyHistory: payload.familyHistory ?? null,
                socialHistory: payload.socialHistory ?? null,
                generalNotes: payload.generalNotes ?? null,
            });
        } else {
            assertEntityBelongsToClinic(profile.clinicId, actor.clinicId);
            profile.change({
                allergies: payload.allergies,
                chronicConditions: payload.chronicConditions,
                currentMedications: payload.currentMedications,
                surgicalHistory: payload.surgicalHistory,
                familyHistory: payload.familyHistory,
                socialHistory: payload.socialHistory,
                generalNotes: payload.generalNotes,
            });
        }

        await this.clinicalProfileRepository.save(profile);

        this.eventDispatcher.dispatch(actor, profile);

        return new ClinicalProfileDto(profile);
    }
}
