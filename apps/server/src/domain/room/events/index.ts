import {RoomChangedEvent} from './room-changed.event';
import {RoomCreatedEvent} from './room-created.event';
import {RoomDeletedEvent} from './room-deleted.event';
import {RoomStateChangedEvent} from './room-state-changed.event';

export * from './room-changed.event';
export * from './room-created.event';
export * from './room-deleted.event';
export * from './room-state-changed.event';

export const roomEvents = [RoomCreatedEvent, RoomChangedEvent, RoomDeletedEvent, RoomStateChangedEvent];
