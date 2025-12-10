import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Appointment} from '../entities';

export class AppointmentCreatedEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_CREATED';
    readonly appointment: Appointment;

    constructor(props: DomainEventProps<AppointmentCreatedEvent>) {
        super(AppointmentCreatedEvent.type, props.timestamp);
        this.appointment = props.appointment;
    }
}
