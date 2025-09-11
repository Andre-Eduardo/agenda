import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {PaymentMethod} from '../entities';

export class PaymentMethodCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'PAYMENT_METHOD_CREATED';
    readonly paymentMethod: PaymentMethod;

    constructor(props: DomainEventProps<PaymentMethodCreatedEvent>) {
        super(PaymentMethodCreatedEvent.type, props);
        this.paymentMethod = props.paymentMethod;
    }
}
