import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Record} from '../entities';

export class RecordCreatedEvent extends DomainEvent {
    static readonly type = 'RECORD_CREATED';
    readonly record: Record;

    constructor(props: DomainEventProps<RecordCreatedEvent>) {
        super(RecordCreatedEvent.type, props.timestamp);
        this.record = props.record;
    }
}
