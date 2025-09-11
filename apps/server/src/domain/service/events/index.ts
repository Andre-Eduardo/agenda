import {ServiceChangedEvent} from './service-changed.event';
import {ServiceCreatedEvent} from './service-created.event';
import {ServiceDeletedEvent} from './service-deleted.event';

export * from './service-changed.event';
export * from './service-created.event';
export * from './service-deleted.event';

export const serviceEvents = [ServiceCreatedEvent, ServiceChangedEvent, ServiceDeletedEvent];
