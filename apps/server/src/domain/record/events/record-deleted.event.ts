import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Record} from '../entities';

export class RecordDeletedEvent extends DomainEvent {
    static readonly type = 'RECORD_DELETED';
    readonly record: Record;

    constructor(props: DomainEventProps<RecordDeletedEvent>) {
        super(RecordDeletedEvent.type, props.timestamp);
        this.record = props.record;
    }
}
