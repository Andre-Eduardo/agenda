import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';
import type {Room} from '@domain/room/entities';

export class RoomCreatedEvent extends DomainEvent {
    static readonly type = 'ROOM_CREATED';
    readonly room: Room;

    constructor(props: DomainEventProps<RoomCreatedEvent>) {
        super(RoomCreatedEvent.type, props.timestamp);
        this.room = props.room;
    }
}
