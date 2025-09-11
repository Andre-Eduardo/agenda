import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Reservation} from '../entities';

export class ReservationChangedEvent extends CompanyDomainEvent {
    static readonly type = 'RESERVATION_CHANGED';
    readonly oldState: Reservation;
    readonly newState: Reservation;

    constructor(props: DomainEventProps<ReservationChangedEvent>) {
        super(ReservationChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
