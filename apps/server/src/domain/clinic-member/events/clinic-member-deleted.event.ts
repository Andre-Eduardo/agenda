import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicMember } from "@domain/clinic-member/entities";

export class ClinicMemberDeletedEvent extends DomainEvent {
  static readonly type = "CLINIC_MEMBER_DELETED";
  readonly member: ClinicMember;

  constructor(props: DomainEventProps<ClinicMemberDeletedEvent>) {
    super(ClinicMemberDeletedEvent.type, props.timestamp);
    this.member = props.member;
  }
}
