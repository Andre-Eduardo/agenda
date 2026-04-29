import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { User } from "@domain/user/entities";

export class UserChangedEvent extends DomainEvent {
  static readonly type = "USER_CHANGED";
  readonly oldState: User;
  readonly newState: User;

  constructor(props: DomainEventProps<UserChangedEvent>) {
    super(UserChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
