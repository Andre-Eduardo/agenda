import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {type MaybeAuthenticatedActor} from '../../domain/@shared/actor';
import {AggregateRoot} from '../../domain/@shared/entity';
import {EventDispatcher, Event, DomainEvent} from '../../domain/event';

@Injectable()
export class EventEmitterDispatcher implements EventDispatcher {
    constructor(private readonly eventEmitter: EventEmitter2) {}

    dispatch<A extends MaybeAuthenticatedActor, E extends AggregateRoot>(actor: A, aggregate: E): void {
        aggregate.events.forEach((event) =>
            this.eventEmitter.emit(event.type, {actor, payload: event} satisfies Event<DomainEvent, A>)
        );
        aggregate.clearEvents();
    }
}
