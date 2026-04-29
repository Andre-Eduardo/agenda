import { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { ProfessionalId } from "@domain/professional/entities";
import type { AppointmentId } from "@domain/appointment/entities";
import type {
  Record,
  RecordId,
  AttendanceType,
  ClinicalStatusTag,
  RecordSource,
} from "@domain/record/entities";

export type RecordSearchFilter = {
  ids?: RecordId[];
  term?: string;
  clinicId?: ClinicId;
  patientId?: PatientId;
  createdByMemberId?: ClinicMemberId;
  responsibleProfessionalId?: ProfessionalId;
  appointmentId?: AppointmentId;
  attendanceType?: AttendanceType;
  clinicalStatus?: ClinicalStatusTag;
  dateStart?: Date;
  dateEnd?: Date;
  source?: RecordSource;
};

export type RecordSortOptions = ["createdAt", "updatedAt", "eventDate"];

export interface RecordRepository {
  findById(id: RecordId): Promise<Record | null>;

  delete(id: RecordId): Promise<void>;

  search(
    pagination: Pagination<RecordSortOptions>,
    filter?: RecordSearchFilter,
  ): Promise<PaginatedList<Record>>;

  save(record: Record): Promise<void>;
}

export abstract class RecordRepository {}
