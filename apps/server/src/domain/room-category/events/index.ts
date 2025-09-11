import {RoomCategoryChangedEvent} from './room-category-changed.event';
import {RoomCategoryCreatedEvent} from './room-category-created.event';
import {RoomCategoryDeletedEvent} from './room-category-deleted.event';

export * from './room-category-changed.event';
export * from './room-category-created.event';
export * from './room-category-deleted.event';

export const roomCategoryEvents = [RoomCategoryChangedEvent, RoomCategoryCreatedEvent, RoomCategoryDeletedEvent];
