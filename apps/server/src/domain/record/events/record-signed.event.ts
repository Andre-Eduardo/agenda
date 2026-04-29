import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { RecordId } from "@domain/record/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";

export class RecordSignedEvent extends DomainEvent {
  static readonly type = "RECORD_SIGNED";
  readonly recordId: RecordId;
  readonly signedByMemberId: ClinicMemberId;

  constructor(props: DomainEventProps<RecordSignedEvent>) {
    super(RecordSignedEvent.type, props.timestamp);
    this.recordId = props.recordId;
    this.signedByMemberId = props.signedByMemberId;
  }
}
