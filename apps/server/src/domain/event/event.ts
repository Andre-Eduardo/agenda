import type { Actor, MaybeAuthenticatedActor } from "@domain/@shared/actor";
import type { EventType } from "@domain/event/event.type";

export abstract class DomainEvent {
  readonly type: EventType;

  readonly timestamp: Date;

  protected constructor(type: EventType, timestamp?: Date) {
    this.type = type;
    this.timestamp = timestamp ?? new Date();
  }
}

export type DomainEventProps<T extends DomainEvent> = Omit<
  Override<
    T,
    {
      timestamp?: Date;
    }
  >,
  "type"
>;

export type Event<
  P extends DomainEvent = DomainEvent,
  A extends MaybeAuthenticatedActor = Actor,
> = {
  actor: A;
  payload: P;
};
