import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Appointment} from '../entities';

export class AppointmentCalledEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_CALLED';
    readonly appointment: Appointment;

    constructor(props: DomainEventProps<AppointmentCalledEvent>) {
        super(AppointmentCalledEvent.type, props.timestamp);
        this.appointment = props.appointment;
    }
}
