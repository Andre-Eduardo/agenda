import {ProductChangedEvent} from './product-changed.event';
import {ProductCreatedEvent} from './product-created.event';
import {ProductDeletedEvent} from './product-deleted.event';

export * from './product-changed.event';
export * from './product-created.event';
export * from './product-deleted.event';

export const productEvents = [ProductCreatedEvent, ProductChangedEvent, ProductDeletedEvent];
