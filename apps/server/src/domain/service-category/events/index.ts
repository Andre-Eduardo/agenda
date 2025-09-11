import {ServiceCategoryChangedEvent} from './service-category-changed.event';
import {ServiceCategoryCreatedEvent} from './service-category-created.event';
import {ServiceCategoryDeletedEvent} from './service-category-deleted.event';

export * from './service-category-changed.event';
export * from './service-category-created.event';
export * from './service-category-deleted.event';

export const serviceCategoryEvents = [
    ServiceCategoryCreatedEvent,
    ServiceCategoryChangedEvent,
    ServiceCategoryDeletedEvent,
];
