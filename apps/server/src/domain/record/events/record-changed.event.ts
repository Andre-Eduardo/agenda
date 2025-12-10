import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Record} from '../entities';

export class RecordChangedEvent extends DomainEvent {
    static readonly type = 'RECORD_CHANGED';
    readonly oldState: Record;
    readonly newState: Record;

    constructor(props: DomainEventProps<RecordChangedEvent>) {
        super(RecordChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
