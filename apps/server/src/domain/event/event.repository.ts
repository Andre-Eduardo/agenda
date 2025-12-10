import type {MaybeAuthenticatedActor} from '../@shared/actor';
import type {PaginatedList, Pagination} from '../@shared/repository';
import { ProfessionalId } from '../professional/entities';
import type {DomainEvent, Event} from './event';
import type {EventType} from './event.type';
import type {EventModel} from './models/event.model';

export type EventSearchFilter<T extends EventType> = {
    type?: T[];
};

export type EventSortOptions = ['type', 'timestamp'];

export interface EventRepository {
    search<T extends EventType>(
        professionalId: ProfessionalId,
        pagination: Pagination<EventSortOptions>,
        filter?: EventSearchFilter<T>
    ): Promise<PaginatedList<EventModel<T>>>;

    add(event: Event<DomainEvent, MaybeAuthenticatedActor>): Promise<void>;
}

export abstract class EventRepository {}
