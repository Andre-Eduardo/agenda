import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {RecordId} from '../entities';
import type {ClinicMemberId} from '../../clinic-member/entities';

export class RecordReopenedEvent extends DomainEvent {
    static readonly type = 'RECORD_REOPENED';
    readonly recordId: RecordId;
    readonly requestedByMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<RecordReopenedEvent>) {
        super(RecordReopenedEvent.type, props.timestamp);
        this.recordId = props.recordId;
        this.requestedByMemberId = props.requestedByMemberId;
    }
}
