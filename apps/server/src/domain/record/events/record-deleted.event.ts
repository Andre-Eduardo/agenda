import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Record } from "@domain/record/entities";

export class RecordDeletedEvent extends DomainEvent {
  static readonly type = "RECORD_DELETED";
  readonly record: Record;

  constructor(props: DomainEventProps<RecordDeletedEvent>) {
    super(RecordDeletedEvent.type, props.timestamp);
    this.record = props.record;
  }
}
