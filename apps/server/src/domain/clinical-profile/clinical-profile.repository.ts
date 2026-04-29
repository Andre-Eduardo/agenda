import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { ProfessionalId } from "@domain/professional/entities";
import type { ClinicalProfile, ClinicalProfileId } from "@domain/clinical-profile/entities";

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
