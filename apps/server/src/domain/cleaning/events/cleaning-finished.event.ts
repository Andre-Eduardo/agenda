import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import type {CleaningEndReasonType} from '../entities';

export class CleaningFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'CLEANING_FINISHED';

    readonly cleaningId: RoomStatusId;
    readonly finishedById: UserId;
    readonly endReason: CleaningEndReasonType;

    constructor(props: DomainEventProps<CleaningFinishedEvent>) {
        super(CleaningFinishedEvent.type, props);
        this.cleaningId = props.cleaningId;
        this.finishedById = props.finishedById;
        this.endReason = props.endReason;
    }
}
