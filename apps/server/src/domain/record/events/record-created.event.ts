import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Record } from "@domain/record/entities";

export class RecordCreatedEvent extends DomainEvent {
  static readonly type = "RECORD_CREATED";
  readonly record: Record;

  constructor(props: DomainEventProps<RecordCreatedEvent>) {
    super(RecordCreatedEvent.type, props.timestamp);
    this.record = props.record;
  }
}
