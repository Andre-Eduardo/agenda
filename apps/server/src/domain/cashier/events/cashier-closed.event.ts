import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Cashier} from '../entities';

export class CashierClosedEvent extends CompanyDomainEvent {
    static readonly type = 'CASHIER_CLOSED';
    readonly cashier: Cashier;

    constructor(props: DomainEventProps<CashierClosedEvent>) {
        super(CashierClosedEvent.type, props);
        this.cashier = props.cashier;
    }
}
