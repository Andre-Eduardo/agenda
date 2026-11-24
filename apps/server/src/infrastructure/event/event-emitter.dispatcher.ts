import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import type {MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {AggregateRoot} from '@domain/@shared/entity';
import {AtomicExecutor} from '@domain/@shared/repository';
import {EventDispatcher, Event, DomainEvent} from '@domain/event';

@Injectable()
export class EventEmitterDispatcher implements EventDispatcher {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly atomicExecutor: AtomicExecutor
    ) {}

    dispatch(actor: MaybeAuthenticatedActor, aggregate: AggregateRoot): void {
        // Snapshot and clear before scheduling: the audit listener clones the payload,
        // which can include this aggregate. Keeping the event on the aggregate would
        // create a recursive aggregate -> event -> aggregate graph.
        // Emit after commit so async listeners never inherit a closed Prisma transaction.
        const events = [...aggregate.events];

        aggregate.clearEvents();

        this.atomicExecutor.defer(() => {
            for (const event of events) {
                this.eventEmitter.emit(event.type, {actor, payload: event} satisfies Event<
                    DomainEvent,
                    MaybeAuthenticatedActor
                >);
            }
        });
    }
}
