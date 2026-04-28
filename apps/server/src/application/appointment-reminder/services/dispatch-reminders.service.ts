import {Inject, Injectable} from '@nestjs/common';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {AppointmentReminderRepository} from '../../../domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    ReminderChannel,
} from '../../../domain/appointment-reminder/entities/appointment-reminder.entity';
import type {ClinicId} from '../../../domain/clinic/entities';
import {NotificationProvider, type NotificationPayload} from '../../../domain/notification/ports/notification-provider.port';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {NOTIFICATION_PROVIDERS} from '../../../infrastructure/notification/notification-provider.token';

@Injectable()
export class DispatchRemindersService {
    constructor(
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientRepository: PatientRepository,
        @Inject(NOTIFICATION_PROVIDERS) private readonly providers: NotificationProvider[],
    ) {}

    async dispatchDue(clinicId: ClinicId): Promise<void> {
        const due = await this.reminderRepository.findDueForDispatch(clinicId, 10);

        for (const reminder of due) {
            await this.dispatch(reminder);
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

        const result = await provider.send(payload);

        if (result.success) {
            reminder.markSent(new Date());
        } else {
            reminder.markFailed(new Date(), result.error ?? 'Unknown error');
        }

        await this.reminderRepository.save(reminder);
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

        const dateStr = appointment.startAt.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
        const timeStr = appointment.startAt.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
        });

        return {
            to,
            message: `Olá, ${patient.name}! Lembramos que você tem uma consulta agendada para ${dateStr} às ${timeStr}.`,
            metadata: {
                reminderId: reminder.id.toString(),
                appointmentId: reminder.appointmentId.toString(),
                patientId: reminder.patientId.toString(),
            },
        };
    }
}
