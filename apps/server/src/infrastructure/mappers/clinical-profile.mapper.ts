import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
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
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
            responsibleProfessionalId: ProfessionalId.from(model.responsibleProfessionalId),
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
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            createdByMemberId: entity.createdByMemberId.toString(),
            responsibleProfessionalId: entity.responsibleProfessionalId.toString(),
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
