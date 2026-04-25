import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {RecordId} from '../entities';
import type {PersonId} from '../../person/entities/person.entity';

export type RecordSavedAction = 'CREATED' | 'UPDATED';

export class RecordSavedEvent extends DomainEvent {
    static readonly type = 'RECORD_SAVED';
    readonly recordId: RecordId;
    readonly patientId: PersonId;
    readonly action: RecordSavedAction;

    constructor(props: DomainEventProps<RecordSavedEvent>) {
        super(RecordSavedEvent.type, props.timestamp);
        this.recordId = props.recordId;
        this.patientId = props.patientId;
        this.action = props.action;
    }
}
