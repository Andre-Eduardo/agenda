import {ReservationCanceledEvent} from './reservation-canceled.event';
import {ReservationChangedEvent} from './reservation-changed.event';
import {ReservationCreatedEvent} from './reservation-created.event';

export * from './reservation-canceled.event';
export * from './reservation-changed.event';
export * from './reservation-created.event';

export const reservationEvents = [ReservationCanceledEvent, ReservationChangedEvent, ReservationCreatedEvent];
