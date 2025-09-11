import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomCategory} from '../entities';

export class RoomCategoryChangedEvent extends CompanyDomainEvent {
    static readonly type = 'ROOM_CATEGORY_CHANGED';
    readonly oldState: RoomCategory;
    readonly newState: RoomCategory;

    constructor(props: DomainEventProps<RoomCategoryChangedEvent>) {
        super(RoomCategoryChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
