import { AppointmentCreatedEvent } from './appointment-created.event';
import { AppointmentChangedEvent } from './appointment-changed.event';
import { AppointmentDeletedEvent } from './appointment-deleted.event';

export * from './appointment-created.event';
export * from './appointment-changed.event';
export * from './appointment-deleted.event';


export const appointmentEvents = [
    AppointmentCreatedEvent,
    AppointmentChangedEvent,
    AppointmentDeletedEvent,
];