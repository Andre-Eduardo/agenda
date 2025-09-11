import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Customer} from '../entities';

export class CustomerChangedEvent extends CompanyDomainEvent {
    static readonly type = 'CUSTOMER_CHANGED';
    readonly oldState: Customer;
    readonly newState: Customer;

    constructor(props: DomainEventProps<CustomerChangedEvent>) {
        super(CustomerChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
