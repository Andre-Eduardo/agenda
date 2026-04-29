import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { User } from "@domain/user/entities";

export class UserSignedUpEvent extends DomainEvent {
  static readonly type = "USER_SIGNED_UP";
  readonly user: User;

  constructor(props: DomainEventProps<UserSignedUpEvent>) {
    super(UserSignedUpEvent.type, props.timestamp);
    this.user = props.user;
  }
}
