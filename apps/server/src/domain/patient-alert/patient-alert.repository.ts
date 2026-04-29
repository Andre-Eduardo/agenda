import type { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { PatientAlert, PatientAlertId } from "@domain/patient-alert/entities";

export type PatientAlertSearchFilter = {
  clinicId?: ClinicId;
  patientId?: PatientId;
  createdByMemberId?: ClinicMemberId;
  isActive?: boolean;
};

export type PatientAlertSortOptions = ["createdAt", "updatedAt", "severity"];

export interface PatientAlertRepository {
  findById(id: PatientAlertId): Promise<PatientAlert | null>;
  save(alert: PatientAlert): Promise<void>;
  delete(id: PatientAlertId): Promise<void>;
  search(
    pagination: Pagination<PatientAlertSortOptions>,
    filter?: PatientAlertSearchFilter,
  ): Promise<PaginatedList<PatientAlert>>;
}

export abstract class PatientAlertRepository {}
