import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UserId } from "@domain/user/entities";

export class UserSignedOutEvent extends DomainEvent {
  static readonly type = "USER_SIGNED_OUT";
  readonly userId: UserId;

  constructor(props: DomainEventProps<UserSignedOutEvent>) {
    super(UserSignedOutEvent.type, props.timestamp);
    this.userId = props.userId;
  }
}
