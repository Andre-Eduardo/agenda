import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Reservation} from '../entities';

export class ReservationCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'RESERVATION_CREATED';
    readonly reservation: Reservation;

    constructor(props: DomainEventProps<ReservationCreatedEvent>) {
        super(ReservationCreatedEvent.type, props);
        this.reservation = props.reservation;
    }
}
