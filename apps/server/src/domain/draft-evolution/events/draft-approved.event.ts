import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { DraftEvolutionId } from "@domain/draft-evolution/entities/draft-evolution.entity";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { RecordId } from "@domain/record/entities/record.entity";

export class DraftApprovedEvent extends DomainEvent {
  static readonly type = "DRAFT_EVOLUTION_APPROVED";
  readonly draftId: DraftEvolutionId;
  readonly recordId: RecordId;
  readonly approvedByMemberId: ClinicMemberId;

  constructor(props: DomainEventProps<DraftApprovedEvent>) {
    super(DraftApprovedEvent.type, props.timestamp);
    this.draftId = props.draftId;
    this.recordId = props.recordId;
    this.approvedByMemberId = props.approvedByMemberId;
  }
}
