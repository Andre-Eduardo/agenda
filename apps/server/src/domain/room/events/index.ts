import {RoomChangedEvent} from '@domain/room/events/room-changed.event';
import {RoomCreatedEvent} from '@domain/room/events/room-created.event';
import {RoomDeletedEvent} from '@domain/room/events/room-deleted.event';

export * from '@domain/room/events/room-changed.event';
export * from '@domain/room/events/room-created.event';
export * from '@domain/room/events/room-deleted.event';

export const roomEvents = [RoomCreatedEvent, RoomChangedEvent, RoomDeletedEvent];
