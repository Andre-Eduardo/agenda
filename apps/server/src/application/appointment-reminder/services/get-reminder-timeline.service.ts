import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentReminderTimelineDto} from '@application/appointment-reminder/dtos/appointment-reminder-timeline.dto';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicId} from '@domain/clinic/entities';

export type GetReminderTimelinePayload = {
    clinicId: ClinicId;
    appointmentId: AppointmentId;
};

/** Every reminder of an appointment with its timeline: attempts, delivery, errors, retries and replies. */
@Injectable()
export class GetReminderTimelineService implements ApplicationService<
    GetReminderTimelinePayload,
    AppointmentReminderTimelineDto[]
> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly eventRepository: AppointmentReminderEventRepository
    ) {}

    async execute({actor, payload}: Command<GetReminderTimelinePayload>): Promise<AppointmentReminderTimelineDto[]> {
        assertEntityBelongsToClinic(payload.clinicId, actor.clinicId);

        const appointment = await this.appointmentRepository.findById(payload.appointmentId);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', payload.appointmentId.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

        const reminders = await this.reminderRepository.findByAppointmentId(payload.appointmentId);
        const events = await this.eventRepository.findByReminderIds(reminders.map((reminder) => reminder.id));

        return reminders.map(
            (reminder) =>
                new AppointmentReminderTimelineDto(
                    reminder,
                    events.filter((event) => event.reminderId.equals(reminder.id))
                )
        );
    }
}
