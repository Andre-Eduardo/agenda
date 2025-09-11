import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Cashier} from '../entities';

export class CashierOpenedEvent extends CompanyDomainEvent {
    static readonly type = 'CASHIER_OPENED';
    readonly cashier: Cashier;

    constructor(props: DomainEventProps<CashierOpenedEvent>) {
        super(CashierOpenedEvent.type, props);
        this.cashier = props.cashier;
    }
}
