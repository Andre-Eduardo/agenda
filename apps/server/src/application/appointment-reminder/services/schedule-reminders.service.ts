import {Injectable} from '@nestjs/common';
import {AppointmentReminderRepository} from '../../../domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    ReminderStatus,
} from '../../../domain/appointment-reminder/entities';
import {ClinicReminderConfigRepository} from '../../../domain/clinic-reminder-config/clinic-reminder-config.repository';
import type {AppointmentId} from '../../../domain/appointment/entities';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';

@Injectable()
export class ScheduleRemindersService {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly configRepository: ClinicReminderConfigRepository,
    ) {}

    async scheduleRemindersForAppointment(appointmentId: AppointmentId): Promise<void> {
        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (appointment === null) return;

        const config = await this.configRepository.findByClinicId(appointment.clinicId);

        if (config === null || !config.isActive) return;

        const reminders: AppointmentReminder[] = [];

        for (const hoursBefore of config.hoursBeforeList) {
            const scheduledAt = new Date(appointment.startAt.getTime() - hoursBefore * 60 * 60 * 1000);

            for (const channel of config.enabledChannels) {
                reminders.push(
                    AppointmentReminder.create({
                        clinicId: appointment.clinicId,
                        appointmentId: appointment.id,
                        patientId: appointment.patientId,
                        channel,
                        status: ReminderStatus.PENDING,
                        scheduledAt,
                        attempts: 0,
                    }),
                );
            }
        }

        if (reminders.length > 0) {
            await this.reminderRepository.saveMany(reminders);
        }
    }
}
