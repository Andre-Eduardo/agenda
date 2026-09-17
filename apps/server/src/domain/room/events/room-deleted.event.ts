import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';
import type {Room} from '@domain/room/entities';

export class RoomDeletedEvent extends DomainEvent {
    static readonly type = 'ROOM_DELETED';
    readonly room: Room;

    constructor(props: DomainEventProps<RoomDeletedEvent>) {
        super(RoomDeletedEvent.type, props.timestamp);
        this.room = props.room;
    }
}
