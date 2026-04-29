import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Person } from "@domain/person/entities";

export class PersonDeletedEvent extends DomainEvent {
  static readonly type = "PERSON_DELETED";
  readonly person: Person;

  constructor(props: DomainEventProps<PersonDeletedEvent>) {
    super(PersonDeletedEvent.type, props.timestamp);
    this.person = props.person;
  }
}
