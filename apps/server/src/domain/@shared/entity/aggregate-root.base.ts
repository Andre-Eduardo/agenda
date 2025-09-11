import type {DomainEvent} from '../../event';
import {Entity} from './entity.base';
import type {EntityId} from './id';

export abstract class AggregateRoot<I extends EntityId<string> = EntityId<string>> extends Entity<I> {
    private domainEvents: DomainEvent[] = [];

    get events(): DomainEvent[] {
        return this.domainEvents;
    }

    clearEvents(): void {
        this.domainEvents = [];
    }

    protected addEvent(domainEvent: DomainEvent, date?: Date): void {
        this.domainEvents.push(domainEvent);
        this.update(date);
    }
}
