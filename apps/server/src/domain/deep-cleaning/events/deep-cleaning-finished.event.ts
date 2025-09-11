import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import type {DeepCleaningEndReasonType} from '../entities';

export class DeepCleaningFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'DEEP_CLEANING_FINISHED';

    readonly deepCleaningId: RoomStatusId;
    readonly finishedById: UserId;
    readonly endReason: DeepCleaningEndReasonType;

    constructor(props: DomainEventProps<DeepCleaningFinishedEvent>) {
        super(DeepCleaningFinishedEvent.type, props);
        this.deepCleaningId = props.deepCleaningId;
        this.finishedById = props.finishedById;
        this.endReason = props.endReason;
    }
}
