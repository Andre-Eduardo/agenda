import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomCategory} from '../entities';

export class RoomCategoryCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_CATEGORY_CREATED';
    readonly roomCategory: RoomCategory;

    constructor(props: DomainEventProps<RoomCategoryCreatedEvent>) {
        super(RoomCategoryCreatedEvent.type, props);
        this.roomCategory = props.roomCategory;
    }
}
