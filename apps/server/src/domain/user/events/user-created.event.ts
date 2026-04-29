import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { User } from "@domain/user/entities";

export class UserCreatedEvent extends DomainEvent {
  static readonly type = "USER_CREATED";
  readonly user: User;

  constructor(props: DomainEventProps<UserCreatedEvent>) {
    super(UserCreatedEvent.type, props.timestamp);
    this.user = props.user;
  }
}
