import type {Appointment} from '@domain/appointment/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

export class AppointmentDeletedEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_DELETED';
    readonly appointment: Appointment;

    constructor(props: DomainEventProps<AppointmentDeletedEvent>) {
        super(AppointmentDeletedEvent.type, props.timestamp);
        this.appointment = props.appointment;
    }
}
