import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UserId } from "@domain/user/entities";

export class UserSignedInEvent extends DomainEvent {
  static readonly type = "USER_SIGNED_IN";
  readonly userId: UserId;

  constructor(props: DomainEventProps<UserSignedInEvent>) {
    super(UserSignedInEvent.type, props.timestamp);
    this.userId = props.userId;
  }
}
