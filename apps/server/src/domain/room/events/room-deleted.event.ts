import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Room} from '../entities';

export class RoomDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_DELETED';
    readonly room: Room;

    constructor(props: DomainEventProps<RoomDeletedEvent>) {
        super(RoomDeletedEvent.type, props);
        this.room = props.room;
    }
}
