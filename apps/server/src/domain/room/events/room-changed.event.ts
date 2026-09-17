import type {DomainEventProps} from '@domain/event';
import {DomainEvent} from '@domain/event';
import type {Room} from '@domain/room/entities';

export class RoomChangedEvent extends DomainEvent {
    static readonly type = 'ROOM_CHANGED';
    readonly oldState: Room;
    readonly newState: Room;

    constructor(props: DomainEventProps<RoomChangedEvent>) {
        super(RoomChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
