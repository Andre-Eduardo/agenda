import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {PaymentMethod} from '../entities';

export class PaymentMethodDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'PAYMENT_METHOD_DELETED';
    readonly paymentMethod: PaymentMethod;

    constructor(props: DomainEventProps<PaymentMethodDeletedEvent>) {
        super(PaymentMethodDeletedEvent.type, props);
        this.paymentMethod = props.paymentMethod;
    }
}
