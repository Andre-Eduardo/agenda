import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Reservation} from '../entities';

export class ReservationCanceledEvent extends CompanyDomainEvent {
    static readonly type = 'RESERVATION_CANCELED';
    readonly reservation: Reservation;

    constructor(props: DomainEventProps<ReservationCanceledEvent>) {
        super(ReservationCanceledEvent.type, props);
        this.reservation = props.reservation;
    }
}
