import type {AppointmentReminder, AppointmentReminderId, ReminderChannel} from '@domain/appointment-reminder/entities';
import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicId} from '@domain/clinic/entities';

export interface AppointmentReminderRepository {
    findById(id: AppointmentReminderId): Promise<AppointmentReminder | null>;
    save(reminder: AppointmentReminder): Promise<void>;
    saveMany(reminders: AppointmentReminder[]): Promise<void>;
    findPendingByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]>;
    findDueForDispatch(clinicId: ClinicId, withinMinutes: number): Promise<AppointmentReminder[]>;
    /**
     * Reivindica atomicamente o envio de um lembrete pendente por `leaseMs`.
     * Retorna `true` só para a primeira instância que conseguir; as demais recebem `false`
     * e não devem enviar. Se a instância cair antes de gravar o resultado, o lease expira
     * e o lembrete volta a ser elegível (entrega "pelo menos uma vez").
     */
    claimForDispatch(id: AppointmentReminderId, leaseMs: number): Promise<boolean>;
    cancelAllPending(appointmentId: AppointmentId): Promise<void>;
    findByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]>;
    /** Pending reminders, across clinics, whose time is before `scheduledBefore`. */
    countPendingScheduledBefore(scheduledBefore: Date): Promise<number>;
    /** The reminder the provider identified with this message id, within the clinic. */
    findByProviderMessageId(
        clinicId: ClinicId | null,
        channel: ReminderChannel,
        providerMessageId: string
    ): Promise<AppointmentReminder | null>;
    /**
     * Most recently sent reminder to any of the destinations since `sentSince`. Used to attribute a
     * patient reply that does not quote the reminder.
     */
    findLatestSentTo(
        clinicId: ClinicId,
        channel: ReminderChannel,
        destinations: string[],
        sentSince: Date
    ): Promise<AppointmentReminder | null>;
}

export abstract class AppointmentReminderRepository {}
