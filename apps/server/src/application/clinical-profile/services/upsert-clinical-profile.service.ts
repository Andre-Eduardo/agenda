import {Injectable} from '@nestjs/common';
import {ClinicalProfile} from '../../../domain/clinical-profile/entities';
import {ClinicalProfileRepository} from '../../../domain/clinical-profile/clinical-profile.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicalProfileDto, UpsertClinicalProfileDto} from '../dtos';

@Injectable()
export class UpsertClinicalProfileService implements ApplicationService<UpsertClinicalProfileDto, ClinicalProfileDto> {
    constructor(
        private readonly clinicalProfileRepository: ClinicalProfileRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpsertClinicalProfileDto>): Promise<ClinicalProfileDto> {
        let profile = await this.clinicalProfileRepository.findByPatientId(payload.patientId);

        if (profile === null) {
            profile = ClinicalProfile.create({
                patientId: payload.patientId,
                professionalId: payload.professionalId,
                allergies: payload.allergies ?? null,
                chronicConditions: payload.chronicConditions ?? null,
                currentMedications: payload.currentMedications ?? null,
                surgicalHistory: payload.surgicalHistory ?? null,
                familyHistory: payload.familyHistory ?? null,
                socialHistory: payload.socialHistory ?? null,
                generalNotes: payload.generalNotes ?? null,
            });
        } else {
            profile.change({
                allergies: payload.allergies ?? undefined,
                chronicConditions: payload.chronicConditions ?? undefined,
                currentMedications: payload.currentMedications ?? undefined,
                surgicalHistory: payload.surgicalHistory ?? undefined,
                familyHistory: payload.familyHistory ?? undefined,
                socialHistory: payload.socialHistory ?? undefined,
                generalNotes: payload.generalNotes ?? undefined,
            });
        }

        await this.clinicalProfileRepository.save(profile);

        this.eventDispatcher.dispatch(actor, profile);

        return new ClinicalProfileDto(profile);
    }
}
