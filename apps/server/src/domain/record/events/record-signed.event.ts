import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {RecordId} from '../entities';
import type {ClinicMemberId} from '../../clinic-member/entities';

export class RecordSignedEvent extends DomainEvent {
    static readonly type = 'RECORD_SIGNED';
    readonly recordId: RecordId;
    readonly signedByMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<RecordSignedEvent>) {
        super(RecordSignedEvent.type, props.timestamp);
        this.recordId = props.recordId;
        this.signedByMemberId = props.signedByMemberId;
    }
}
