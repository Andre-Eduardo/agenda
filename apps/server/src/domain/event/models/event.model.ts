import type { Jsonify } from "type-fest";
import type { DomainEvent } from "@domain/event/event";
import type { DomainEventType, EventType } from "@domain/event/event.type";

export type EventPayload<T extends DomainEvent> = Omit<Jsonify<T>, keyof DomainEvent>;

export type EventPayloadMap<T extends DomainEventType = DomainEventType> = {
  [K in T as K["type"]]: EventPayload<InstanceType<K>>;
};

export type EventModel<T extends EventType = EventType> = {
  [K in T]: {
    id: number;
    type: K;
    payload: EventPayloadMap[K];
    timestamp: Date;
  };
}[T];
