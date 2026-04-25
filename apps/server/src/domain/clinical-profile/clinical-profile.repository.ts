import type {ClinicId} from '../clinic/entities';
import type {ClinicMemberId} from '../clinic-member/entities';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {ClinicalProfile, ClinicalProfileId} from './entities';

export type ClinicalProfileSearchFilter = {
    clinicId?: ClinicId;
    patientId?: PatientId;
    createdByMemberId?: ClinicMemberId;
    responsibleProfessionalId?: ProfessionalId;
};

export interface ClinicalProfileRepository {
    findByPatientId(patientId: PatientId): Promise<ClinicalProfile | null>;
    findById(id: ClinicalProfileId): Promise<ClinicalProfile | null>;
    save(profile: ClinicalProfile): Promise<void>;
}

export abstract class ClinicalProfileRepository {}
