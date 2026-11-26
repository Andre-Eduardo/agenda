import type {AppointmentReminderEvent, AppointmentReminderId} from '@domain/appointment-reminder/entities';

export interface AppointmentReminderEventRepository {
    /**
     * Stores the event unless one with the same `source` + `externalId` already exists.
     * Returns `false` for a duplicate, which is how webhook deliveries stay idempotent.
     */
    recordIfAbsent(event: AppointmentReminderEvent): Promise<boolean>;
    /** Events of the given reminders, oldest first. */
    findByReminderIds(reminderIds: AppointmentReminderId[]): Promise<AppointmentReminderEvent[]>;
}

export abstract class AppointmentReminderEventRepository {}
