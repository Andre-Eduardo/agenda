import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {ClinicalProfile, ClinicalProfileId} from './entities';

export type ClinicalProfileSearchFilter = {
    patientId?: PatientId;
    professionalId?: ProfessionalId;
};

export interface ClinicalProfileRepository {
    findByPatientId(patientId: PatientId): Promise<ClinicalProfile | null>;
    findById(id: ClinicalProfileId): Promise<ClinicalProfile | null>;
    save(profile: ClinicalProfile): Promise<void>;
}

export abstract class ClinicalProfileRepository {}
