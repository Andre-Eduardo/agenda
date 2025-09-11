import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Customer} from '../entities';

export class CustomerDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'CUSTOMER_DELETED';
    readonly customer: Customer;

    constructor(props: DomainEventProps<CustomerDeletedEvent>) {
        super(CustomerDeletedEvent.type, props);
        this.customer = props.customer;
    }
}
