import {CustomerChangedEvent} from './customer-changed.event';
import {CustomerCreatedEvent} from './customer-created.event';
import {CustomerDeletedEvent} from './customer-deleted.event';

export * from './customer-changed.event';
export * from './customer-created.event';
export * from './customer-deleted.event';

export const customerEvents = [CustomerChangedEvent, CustomerCreatedEvent, CustomerDeletedEvent];
