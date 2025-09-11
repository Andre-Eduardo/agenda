import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomId} from '../entities';
import type {RoomState} from '../models/room-state';

export class RoomStateChangedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_STATE_CHANGED';
    readonly roomId: RoomId;
    readonly oldState: RoomState;
    readonly newState: RoomState;

    constructor(props: DomainEventProps<RoomStateChangedEvent>) {
        super(RoomStateChangedEvent.type, props);
        this.roomId = props.roomId;
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
