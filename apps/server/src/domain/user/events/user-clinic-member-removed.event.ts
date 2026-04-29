import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UserId } from "@domain/user/entities";

export class UserClinicMemberRemovedEvent extends DomainEvent {
  static readonly type = "USER_CLINIC_MEMBER_REMOVED";
  readonly userId: UserId;
  readonly clinicMemberId: ClinicMemberId;

  constructor(props: DomainEventProps<UserClinicMemberRemovedEvent>) {
    super(UserClinicMemberRemovedEvent.type, props.timestamp);
    this.userId = props.userId;
    this.clinicMemberId = props.clinicMemberId;
  }
}
