import type { MaybeAuthenticatedActor } from "@domain/@shared/actor";
import type { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { DomainEvent, Event } from "@domain/event/event";
import type { EventType } from "@domain/event/event.type";
import type { EventModel } from "@domain/event/models/event.model";

export type EventSearchFilter<T extends EventType> = {
  type?: T[];
};

export type EventSortOptions = ["type", "timestamp"];

export interface EventRepository {
  search<T extends EventType>(
    clinicId: ClinicId,
    pagination: Pagination<EventSortOptions>,
    filter?: EventSearchFilter<T>,
  ): Promise<PaginatedList<EventModel<T>>>;

  add(event: Event<DomainEvent, MaybeAuthenticatedActor>): Promise<void>;
}

export abstract class EventRepository {}
