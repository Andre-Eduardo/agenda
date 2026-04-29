import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { RecordId } from "@domain/record/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";

export class RecordReopenedEvent extends DomainEvent {
  static readonly type = "RECORD_REOPENED";
  readonly recordId: RecordId;
  readonly requestedByMemberId: ClinicMemberId;

  constructor(props: DomainEventProps<RecordReopenedEvent>) {
    super(RecordReopenedEvent.type, props.timestamp);
    this.recordId = props.recordId;
    this.requestedByMemberId = props.requestedByMemberId;
  }
}
