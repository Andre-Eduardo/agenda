import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Room} from '../entities';

export class RoomChangedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_CHANGED';
    readonly oldState: Room;
    readonly newState: Room;

    constructor(props: DomainEventProps<RoomChangedEvent>) {
        super(RoomChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
