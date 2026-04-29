import { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { Appointment, AppointmentId, AppointmentStatus } from "@domain/appointment/entities";

export type AppointmentSearchFilter = {
  ids?: AppointmentId[];
  term?: string;
  clinicId?: ClinicId;
  attendedByMemberId?: ClinicMemberId;
  createdByMemberId?: ClinicMemberId;
  patientId?: PatientId;
  status?: AppointmentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
};

export type AppointmentSortOptions = ["createdAt", "updatedAt", "startAt"];

export interface AppointmentRepository {
  findById(id: AppointmentId): Promise<Appointment | null>;

  delete(id: AppointmentId): Promise<void>;

  search(
    pagination: Pagination<AppointmentSortOptions>,
    filter?: AppointmentSearchFilter,
  ): Promise<PaginatedList<Appointment>>;

  save(appointment: Appointment): Promise<void>;

  findConflicts(
    attendedByMemberId: ClinicMemberId,
    startAt: Date,
    endAt: Date,
    excludeId?: AppointmentId,
  ): Promise<Appointment[]>;
}

export abstract class AppointmentRepository {}
