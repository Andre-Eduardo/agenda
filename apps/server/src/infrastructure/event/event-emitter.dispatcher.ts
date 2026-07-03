import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import type {MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {AggregateRoot} from '@domain/@shared/entity';
import {EventDispatcher, Event, DomainEvent} from '@domain/event';

@Injectable()
export class EventEmitterDispatcher implements EventDispatcher {
    constructor(private readonly eventEmitter: EventEmitter2) {}

    dispatch<A extends MaybeAuthenticatedActor, E extends AggregateRoot>(actor: A, aggregate: E): void {
        // Snapshot and clear before emitting: listeners run synchronously up to their first
        // `await` (e.g. EventPrismaRepository's audit listener structuredClone-s the payload,
        // which embeds `aggregate` itself), so if `aggregate.events` still held this same
        // event at that point, the clone would walk aggregate -> events[0] -> aggregate forever.
        const events = [...aggregate.events];

        aggregate.clearEvents();

        events.forEach((event) =>
            this.eventEmitter.emit(event.type, {actor, payload: event} satisfies Event<DomainEvent, A>)
        );
    }
}
