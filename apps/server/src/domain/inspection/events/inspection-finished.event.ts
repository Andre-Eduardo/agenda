import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import type {InspectionEndReasonType} from '../entities';

export class InspectionFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'INSPECTION_FINISHED';

    readonly inspectionId: RoomStatusId;
    readonly finishedById: UserId;
    readonly endReason: InspectionEndReasonType;

    constructor(props: DomainEventProps<InspectionFinishedEvent>) {
        super(InspectionFinishedEvent.type, props);
        this.inspectionId = props.inspectionId;
        this.finishedById = props.finishedById;
        this.endReason = props.endReason;
    }
}
