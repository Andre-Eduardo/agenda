import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Customer} from '../entities';

export class CustomerCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'CUSTOMER_CREATED';
    readonly customer: Customer;

    constructor(props: DomainEventProps<CustomerCreatedEvent>) {
        super(CustomerCreatedEvent.type, props);
        this.customer = props.customer;
    }
}
