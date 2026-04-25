import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {AppointmentPayment} from '../entities';

export class AppointmentPaymentRegisteredEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_PAYMENT_REGISTERED';
    readonly payment: AppointmentPayment;

    constructor(props: DomainEventProps<AppointmentPaymentRegisteredEvent>) {
        super(AppointmentPaymentRegisteredEvent.type, props.timestamp);
        this.payment = props.payment;
    }
}
