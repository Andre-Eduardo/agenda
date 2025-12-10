import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Appointment} from '../entities';

export class AppointmentDeletedEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_DELETED';
    readonly appointment: Appointment;

    constructor(props: DomainEventProps<AppointmentDeletedEvent>) {
        super(AppointmentDeletedEvent.type, props.timestamp);
        this.appointment = props.appointment;
    }
}
