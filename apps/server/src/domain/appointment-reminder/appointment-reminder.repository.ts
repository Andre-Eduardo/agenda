import type { AppointmentId } from "@domain/appointment/entities";
import type { ClinicId } from "@domain/clinic/entities";
import type {
  AppointmentReminder,
  AppointmentReminderId,
} from "@domain/appointment-reminder/entities";

export interface AppointmentReminderRepository {
  findById(id: AppointmentReminderId): Promise<AppointmentReminder | null>;
  save(reminder: AppointmentReminder): Promise<void>;
  saveMany(reminders: AppointmentReminder[]): Promise<void>;
  findPendingByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]>;
  findDueForDispatch(clinicId: ClinicId, withinMinutes: number): Promise<AppointmentReminder[]>;
  cancelAllPending(appointmentId: AppointmentId): Promise<void>;
}

export abstract class AppointmentReminderRepository {}
