import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {ClinicalProfile, ClinicalProfileId} from '../../domain/clinical-profile/entities';
import {MapperWithoutDto} from './mapper';

export type ClinicalProfileModel = PrismaClient.ClinicalProfile;

@Injectable()
export class ClinicalProfileMapper extends MapperWithoutDto<ClinicalProfile, ClinicalProfileModel> {
    toDomain(model: ClinicalProfileModel): ClinicalProfile {
        return new ClinicalProfile({
            ...model,
            id: ClinicalProfileId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            allergies: model.allergies ?? null,
            chronicConditions: model.chronicConditions ?? null,
            currentMedications: model.currentMedications ?? null,
            surgicalHistory: model.surgicalHistory ?? null,
            familyHistory: model.familyHistory ?? null,
            socialHistory: model.socialHistory ?? null,
            generalNotes: model.generalNotes ?? null,
            deletedAt: null,
        });
    }

    toPersistence(entity: ClinicalProfile): ClinicalProfileModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            allergies: entity.allergies,
            chronicConditions: entity.chronicConditions,
            currentMedications: entity.currentMedications,
            surgicalHistory: entity.surgicalHistory,
            familyHistory: entity.familyHistory,
            socialHistory: entity.socialHistory,
            generalNotes: entity.generalNotes,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
