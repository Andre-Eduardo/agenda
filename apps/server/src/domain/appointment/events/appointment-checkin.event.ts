import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Appointment} from '../entities';

export class AppointmentCheckinEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_CHECKIN';
    readonly appointment: Appointment;

    constructor(props: DomainEventProps<AppointmentCheckinEvent>) {
        super(AppointmentCheckinEvent.type, props.timestamp);
        this.appointment = props.appointment;
    }
}
