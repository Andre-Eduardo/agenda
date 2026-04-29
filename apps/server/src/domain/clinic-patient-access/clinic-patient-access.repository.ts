import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type {
  ClinicPatientAccess,
  ClinicPatientAccessId,
} from "@domain/clinic-patient-access/entities";

export interface ClinicPatientAccessRepository {
  findById(id: ClinicPatientAccessId): Promise<ClinicPatientAccess | null>;
  findByMemberAndPatient(
    memberId: ClinicMemberId,
    patientId: PatientId,
  ): Promise<ClinicPatientAccess | null>;
  findByPatientId(clinicId: ClinicId, patientId: PatientId): Promise<ClinicPatientAccess[]>;
  findByMemberId(clinicId: ClinicId, memberId: ClinicMemberId): Promise<ClinicPatientAccess[]>;
  save(access: ClinicPatientAccess): Promise<void>;
}

export abstract class ClinicPatientAccessRepository {}
