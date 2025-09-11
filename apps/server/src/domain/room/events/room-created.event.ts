import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Room} from '../entities';

export class RoomCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_CREATED';
    readonly room: Room;

    constructor(props: DomainEventProps<RoomCreatedEvent>) {
        super(RoomCreatedEvent.type, props);
        this.room = props.room;
    }
}
