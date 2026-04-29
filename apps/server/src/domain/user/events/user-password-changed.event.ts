import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UserId } from "@domain/user/entities";

export class UserPasswordChangedEvent extends DomainEvent {
  static readonly type = "USER_PASSWORD_CHANGED";
  readonly userId: UserId;

  constructor(props: DomainEventProps<UserPasswordChangedEvent>) {
    super(UserPasswordChangedEvent.type, props.timestamp);
    this.userId = props.userId;
  }
}
