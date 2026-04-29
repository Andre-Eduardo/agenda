import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicMember } from "@domain/clinic-member/entities";

export class ClinicMemberCreatedEvent extends DomainEvent {
  static readonly type = "CLINIC_MEMBER_CREATED";
  readonly member: ClinicMember;

  constructor(props: DomainEventProps<ClinicMemberCreatedEvent>) {
    super(ClinicMemberCreatedEvent.type, props.timestamp);
    this.member = props.member;
  }
}
