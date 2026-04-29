import type { MaybeAuthenticatedActor } from "@domain/@shared/actor";
import type { AggregateRoot } from "@domain/@shared/entity";

export interface EventDispatcher {
  dispatch<A extends MaybeAuthenticatedActor, E extends AggregateRoot>(
    actor: A,
    aggregate: E,
  ): void;
}

export abstract class EventDispatcher {}
