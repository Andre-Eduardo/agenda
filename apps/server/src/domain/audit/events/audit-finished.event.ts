import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import type {AuditEndReasonType} from '../entities';

export class AuditFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'AUDIT_FINISHED';

    readonly auditId: RoomStatusId;
    readonly finishedById: UserId;
    readonly endReason: AuditEndReasonType;

    constructor(props: DomainEventProps<AuditFinishedEvent>) {
        super(AuditFinishedEvent.type, props);
        this.auditId = props.auditId;
        this.finishedById = props.finishedById;
        this.endReason = props.endReason;
    }
}
