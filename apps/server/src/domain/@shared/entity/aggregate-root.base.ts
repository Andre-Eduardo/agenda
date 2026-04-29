import type { DomainEvent } from "@domain/event";
import { Entity } from "@domain/@shared/entity/entity.base";
import type { EntityId } from "@domain/@shared/entity/id";

export abstract class AggregateRoot<
  I extends EntityId<string> = EntityId<string>,
> extends Entity<I> {
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
