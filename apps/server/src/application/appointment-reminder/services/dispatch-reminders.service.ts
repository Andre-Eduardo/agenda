import {Inject, Injectable, Logger} from '@nestjs/common';
import {ReminderMessageRenderer} from '@application/clinic-reminder-config/services/reminder-message.renderer';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {AppointmentReminder, ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {REMINDER_SUBJECT} from '@domain/clinic-reminder-config/reminder-message-template';
import type {ClinicId} from '@domain/clinic/entities';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {PatientRepository} from '@domain/patient/patient.repository';
import {NOTIFICATION_PROVIDERS} from '@infrastructure/notification/notification-provider.token';

@Injectable()
export class DispatchRemindersService {
    private readonly logger = new Logger(DispatchRemindersService.name);

    constructor(
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly messageRenderer: ReminderMessageRenderer,
        @Inject(NOTIFICATION_PROVIDERS) private readonly providers: NotificationProvider[]
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

        let payload: NotificationPayload;

        try {
            payload = await this.buildPayload(reminder);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to build payload';

            reminder.markFailed(new Date(), message);
            await this.reminderRepository.save(reminder);

            return;
        }

        const result = await this.send(provider, payload);

        if (result.success) {
            reminder.markSent(new Date());
        } else {
            reminder.markFailed(new Date(), result.error ?? 'Unknown error');
        }

        await this.reminderRepository.save(reminder);
    }

    /** Providers should not throw, but a defect in one must still become a recorded failure. */
    private async send(provider: NotificationProvider, payload: NotificationPayload): Promise<NotificationResult> {
        try {
            return await provider.send(payload);
        } catch (error) {
            return {success: false, error: error instanceof Error ? error.message : 'Provider failed to send'};
        }
    }

    private async buildPayload(reminder: AppointmentReminder): Promise<NotificationPayload> {
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
            clinicId: reminder.clinicId,
            to,
            subject: REMINDER_SUBJECT,
            message,
            metadata: {
                reminderId: reminder.id.toString(),
                appointmentId: reminder.appointmentId.toString(),
                patientId: reminder.patientId.toString(),
            },
        };
    }
}
