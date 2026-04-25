import type {AppointmentId} from '../appointment/entities';
import type {ClinicId} from '../clinic/entities';
import type {AppointmentReminder, AppointmentReminderId} from './entities';

export interface AppointmentReminderRepository {
    findById(id: AppointmentReminderId): Promise<AppointmentReminder | null>;
    save(reminder: AppointmentReminder): Promise<void>;
    saveMany(reminders: AppointmentReminder[]): Promise<void>;
    findPendingByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]>;
    findDueForDispatch(clinicId: ClinicId, withinMinutes: number): Promise<AppointmentReminder[]>;
    cancelAllPending(appointmentId: AppointmentId): Promise<void>;
}

export abstract class AppointmentReminderRepository {}
