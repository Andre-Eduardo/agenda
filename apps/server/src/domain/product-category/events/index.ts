import {ProductCategoryChangedEvent} from './product-category-changed.event';
import {ProductCategoryCreatedEvent} from './product-category-created.event';
import {ProductCategoryDeletedEvent} from './product-category-deleted.event';

export * from './product-category-changed.event';
export * from './product-category-created.event';
export * from './product-category-deleted.event';

export const productCategoryEvents = [
    ProductCategoryChangedEvent,
    ProductCategoryCreatedEvent,
    ProductCategoryDeletedEvent,
];
