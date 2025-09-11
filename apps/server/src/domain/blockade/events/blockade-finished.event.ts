import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';

export class BlockadeFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'BLOCKADE_FINISHED';
    readonly blockadeId: RoomStatusId;
    readonly finishedById: UserId;

    constructor(props: DomainEventProps<BlockadeFinishedEvent>) {
        super(BlockadeFinishedEvent.type, props);
        this.blockadeId = props.blockadeId;
        this.finishedById = props.finishedById;
    }
}
