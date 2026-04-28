import {AppointmentChangedEvent} from './appointment-changed.event';
import {AppointmentCreatedEvent} from './appointment-created.event';
import {AppointmentDeletedEvent} from './appointment-deleted.event';
import {AppointmentCheckinEvent} from './appointment-checkin.event';
import {AppointmentCalledEvent} from './appointment-called.event';

export * from './appointment-created.event';
export * from './appointment-changed.event';
export * from './appointment-checkin.event';
export * from './appointment-deleted.event';
export * from './appointment-called.event';

export const appointmentEvents = [
    AppointmentCreatedEvent,
    AppointmentChangedEvent,
    AppointmentDeletedEvent,
    AppointmentCheckinEvent,
    AppointmentCalledEvent,
];
