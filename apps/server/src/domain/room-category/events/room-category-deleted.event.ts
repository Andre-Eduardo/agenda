import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomCategory} from '../entities';

export class RoomCategoryDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_CATEGORY_DELETED';
    readonly roomCategory: RoomCategory;

    constructor(props: DomainEventProps<RoomCategoryDeletedEvent>) {
        super(RoomCategoryDeletedEvent.type, props);
        this.roomCategory = props.roomCategory;
    }
}
