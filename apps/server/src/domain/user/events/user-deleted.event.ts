import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { User } from "@domain/user/entities";

export class UserDeletedEvent extends DomainEvent {
  static readonly type = "USER_DELETED";
  readonly user: User;

  constructor(props: DomainEventProps<UserDeletedEvent>) {
    super(UserDeletedEvent.type, props.timestamp);
    this.user = props.user;
  }
}
