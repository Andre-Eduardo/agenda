import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {Person} from '../entities';

export class PersonDeletedEvent extends DomainEvent {
    static readonly type = 'PERSON_DELETED';
    readonly person: Person;

    constructor(props: DomainEventProps<PersonDeletedEvent>) {
        super(PersonDeletedEvent.type, props.timestamp);
        this.person = props.person;
    }
}
