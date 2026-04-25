import {Injectable} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {AppointmentCreatedEvent} from '../../../domain/appointment/events/appointment-created.event';
import {AppointmentChangedEvent} from '../../../domain/appointment/events/appointment-changed.event';
import {AppointmentStatus} from '../../../domain/appointment/entities';
import {Event} from '../../../domain/event';
import {ScheduleRemindersService} from '../services/schedule-reminders.service';
import {CancelRemindersService} from '../services/cancel-reminders.service';

@Injectable()
export class AppointmentReminderListener {
    constructor(
        private readonly scheduleRemindersService: ScheduleRemindersService,
        private readonly cancelRemindersService: CancelRemindersService,
    ) {}

    @OnEvent(AppointmentCreatedEvent.type)
    async onAppointmentCreated(event: Event<AppointmentCreatedEvent>): Promise<void> {
        await this.scheduleRemindersService.scheduleRemindersForAppointment(
            event.payload.appointment.id,
        );
    }

    @OnEvent(AppointmentChangedEvent.type)
    async onAppointmentChanged(event: Event<AppointmentChangedEvent>): Promise<void> {
        if (event.payload.newState.status === AppointmentStatus.CANCELLED) {
            await this.cancelRemindersService.cancelPendingReminders(
                event.payload.newState.id,
            );
        }
    }
}
