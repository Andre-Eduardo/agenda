import {PaymentMethodChangedEvent} from './payment-method-changed.event';
import {PaymentMethodCreatedEvent} from './payment-method-created.event';
import {PaymentMethodDeletedEvent} from './payment-method-deleted.event';

export * from './payment-method-changed.event';
export * from './payment-method-created.event';
export * from './payment-method-deleted.event';

export const paymentMethodEvents = [PaymentMethodChangedEvent, PaymentMethodCreatedEvent, PaymentMethodDeletedEvent];
