import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { WorkingHours, WorkingHoursId } from "@domain/professional/entities";

export interface WorkingHoursRepository {
  findById(id: WorkingHoursId): Promise<WorkingHours | null>;

  findByMember(clinicMemberId: ClinicMemberId): Promise<WorkingHours[]>;

  findByMemberAndDay(clinicMemberId: ClinicMemberId, dayOfWeek: number): Promise<WorkingHours[]>;

  save(workingHours: WorkingHours): Promise<void>;

  delete(id: WorkingHoursId): Promise<void>;
}

export abstract class WorkingHoursRepository {}
