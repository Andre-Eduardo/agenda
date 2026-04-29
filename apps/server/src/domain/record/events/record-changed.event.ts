import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Record } from "@domain/record/entities";

export class RecordChangedEvent extends DomainEvent {
  static readonly type = "RECORD_CHANGED";
  readonly oldState: Record;
  readonly newState: Record;

  constructor(props: DomainEventProps<RecordChangedEvent>) {
    super(RecordChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
