import {Inject, Injectable, Logger} from '@nestjs/common';
import {Metrics, NotificationMetric} from '@application/@shared/telemetry';
import {ReminderMessageRenderer} from '@application/clinic-reminder-config/services/reminder-message.renderer';
import {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    AppointmentReminderEvent,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';
import {nextReminderRetryAt} from '@domain/appointment-reminder/reminder-retry-policy';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {REMINDER_SUBJECT} from '@domain/clinic-reminder-config/reminder-message-template';
import type {ClinicId} from '@domain/clinic/entities';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {optedOutChannels} from '@domain/patient-communication-preference/communication-preferences';
import {WHATSAPP_OPT_OUT_FOOTER} from '@domain/patient-communication-preference/opt-out-keywords';
import {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';
import {PatientRepository} from '@domain/patient/patient.repository';
import {NOTIFICATION_PROVIDERS} from '@infrastructure/notification/notification-provider.token';

/**
 * Tempo que uma instância tem para enviar um lembrete reivindicado antes que outra possa
 * tentar de novo. Bem acima do tempo de um envio e do intervalo do cron (5 min).
 */
export const REMINDER_DISPATCH_LEASE_MS = 10 * 60 * 1000;

type PreparedReminder = {
    payload: NotificationPayload;
    appointmentStartAt: Date;
};

@Injectable()
export class DispatchRemindersService {
    private readonly logger = new Logger(DispatchRemindersService.name);

    constructor(
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly messageRenderer: ReminderMessageRenderer,
        @Inject(NOTIFICATION_PROVIDERS) private readonly providers: NotificationProvider[],
        private readonly eventRepository: AppointmentReminderEventRepository,
        private readonly metrics: Metrics,
        private readonly preferenceRepository: PatientCommunicationPreferenceRepository
    ) {}

    async dispatchDue(clinicId: ClinicId): Promise<void> {
        const due = await this.reminderRepository.findDueForDispatch(clinicId, 10);

        for (const reminder of due) {
            try {
                await this.dispatch(reminder);
            } catch (error) {
                // A single broken reminder must not block the rest of the batch.
                this.logger.error(`Failed to dispatch reminder ${reminder.id.toString()}`, error);
            }
        }
    }

    private async dispatch(reminder: AppointmentReminder): Promise<void> {
        const provider = this.providers.find((p) => p.channel === reminder.channel);

        if (!provider) return;

        // Com várias réplicas da API o cron roda em todas ao mesmo tempo. Só envia quem
        // ganhar o claim atômico no banco; as outras pulam o lembrete.
        const claimed = await this.reminderRepository.claimForDispatch(reminder.id, REMINDER_DISPATCH_LEASE_MS);

        if (!claimed) return;

        if (await this.patientOptedOut(reminder)) {
            await this.skipOptedOut(reminder, new Date());

            return;
        }

        let prepared: PreparedReminder;

        try {
            prepared = await this.buildPayload(reminder);
        } catch (error) {
            // Missing data (no phone, deleted patient) will not fix itself: no retry.
            const message = error instanceof Error ? error.message : 'Failed to build payload';

            await this.recordFailure(reminder, new Date(), message, null);

            return;
        }

        const startedAt = Date.now();
        const result = await this.send(provider, prepared.payload);
        const now = new Date();

        this.metrics.observe(NotificationMetric.SEND_DURATION, Date.now() - startedAt, {
            channel: reminder.channel,
            outcome: result.success ? 'sent' : 'failed',
        });

        if (result.success) {
            reminder.markSent(now, {
                destination: result.destination ?? prepared.payload.to,
                providerMessageId: result.providerId ?? null,
            });
            await this.reminderRepository.save(reminder);
            await this.recordEvent(reminder, ReminderEventType.SENT, now, null);
            this.metrics.count(NotificationMetric.ATTEMPT, 1, {channel: reminder.channel, outcome: 'sent'});

            return;
        }

        const retryAt = nextReminderRetryAt(reminder.attempts + 1, now, prepared.appointmentStartAt);

        await this.recordFailure(reminder, now, result.error ?? 'Unknown error', retryAt);
    }

    /** Read at send time, so an opt-out recorded after scheduling still stops the reminder (L3-04). */
    private async patientOptedOut(reminder: AppointmentReminder): Promise<boolean> {
        const history = await this.preferenceRepository.findHistory(reminder.clinicId, reminder.patientId);

        return optedOutChannels(history).has(reminder.channel);
    }

    private async skipOptedOut(reminder: AppointmentReminder, now: Date): Promise<void> {
        reminder.cancel();
        await this.reminderRepository.save(reminder);
        await this.recordEvent(reminder, ReminderEventType.OPTED_OUT, now, 'Patient opted out of this channel');
        this.metrics.count(NotificationMetric.ATTEMPT, 1, {channel: reminder.channel, outcome: 'opted_out'});
    }

    private async recordFailure(
        reminder: AppointmentReminder,
        failedAt: Date,
        message: string,
        retryAt: Date | null
    ): Promise<void> {
        reminder.markFailed(failedAt, message, retryAt);
        await this.reminderRepository.save(reminder);
        await this.recordEvent(reminder, ReminderEventType.SEND_FAILED, failedAt, message);

        if (retryAt !== null) {
            // The retry time goes in the detail: the event itself happened now.
            await this.recordEvent(reminder, ReminderEventType.RETRY_SCHEDULED, failedAt, retryAt.toISOString());
        }

        this.metrics.count(NotificationMetric.ATTEMPT, 1, {
            channel: reminder.channel,
            outcome: retryAt === null ? 'failed' : 'retry',
        });
    }

    private async recordEvent(
        reminder: AppointmentReminder,
        type: ReminderEventType,
        occurredAt: Date,
        detail: string | null
    ): Promise<void> {
        await this.eventRepository.recordIfAbsent(
            AppointmentReminderEvent.record({
                clinicId: reminder.clinicId,
                reminderId: reminder.id,
                type,
                source: ReminderEventSource.SYSTEM,
                attempt: reminder.attempts,
                occurredAt,
                detail,
            })
        );
    }

    /** Providers should not throw, but a defect in one must still become a recorded failure. */
    private async send(provider: NotificationProvider, payload: NotificationPayload): Promise<NotificationResult> {
        try {
            return await provider.send(payload);
        } catch (error) {
            return {success: false, error: error instanceof Error ? error.message : 'Provider failed to send'};
        }
    }

    private async buildPayload(reminder: AppointmentReminder): Promise<PreparedReminder> {
        const appointment = await this.appointmentRepository.findById(reminder.appointmentId);

        if (appointment === null) {
            throw new Error(`Appointment ${reminder.appointmentId.toString()} not found`);
        }

        const patient = await this.patientRepository.findById(reminder.patientId, reminder.clinicId);

        if (patient === null) {
            throw new Error(`Patient ${reminder.patientId.toString()} not found`);
        }

        let to: string;

        if (reminder.channel === ReminderChannel.EMAIL) {
            if (!patient.email) {
                throw new Error(`Patient ${reminder.patientId.toString()} has no email address`);
            }

            to = patient.email;
        } else {
            if (!patient.phone) {
                throw new Error(`Patient ${reminder.patientId.toString()} has no phone number`);
            }

            to = patient.phone.toString();
        }

        // The text is read at send time, so an edit applies to the next reminders sent.
        const message = await this.messageRenderer.render({
            clinicId: reminder.clinicId,
            patientName: patient.name,
            startAt: appointment.startAt,
            professionalId: appointment.attendedByMemberId,
        });

        return {
            appointmentStartAt: appointment.startAt,
            payload: {
                clinicId: reminder.clinicId,
                to,
                subject: REMINDER_SUBJECT,
                message:
                    reminder.channel === ReminderChannel.WHATSAPP
                        ? `${message}\n\n${WHATSAPP_OPT_OUT_FOOTER}`
                        : message,
                metadata: {
                    reminderId: reminder.id.toString(),
                    appointmentId: reminder.appointmentId.toString(),
                    patientId: reminder.patientId.toString(),
                },
            },
        };
    }
}
