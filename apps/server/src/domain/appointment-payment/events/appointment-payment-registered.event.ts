import type {AppointmentPayment} from '@domain/appointment-payment/entities';
import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';

export class AppointmentPaymentRegisteredEvent extends DomainEvent {
    static readonly type = 'APPOINTMENT_PAYMENT_REGISTERED';
    readonly payment: AppointmentPayment;

    constructor(props: DomainEventProps<AppointmentPaymentRegisteredEvent>) {
        super(AppointmentPaymentRegisteredEvent.type, props.timestamp);
        this.payment = props.payment;
    }
}
