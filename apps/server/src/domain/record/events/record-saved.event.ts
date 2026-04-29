import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { RecordId } from "@domain/record/entities";
import type { PersonId } from "@domain/person/entities/person.entity";

export type RecordSavedAction = "CREATED" | "UPDATED";

export class RecordSavedEvent extends DomainEvent {
  static readonly type = "RECORD_SAVED";
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
