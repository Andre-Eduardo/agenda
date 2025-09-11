import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {PaymentMethod} from '../entities';

export class PaymentMethodChangedEvent extends CompanyDomainEvent {
    static readonly type = 'PAYMENT_METHOD_CHANGED';
    readonly oldState: PaymentMethod;
    readonly newState: PaymentMethod;

    constructor(props: DomainEventProps<PaymentMethodChangedEvent>) {
        super(PaymentMethodChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
