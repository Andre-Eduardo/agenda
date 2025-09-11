import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {MaybeAuthenticatedActor} from '../../domain/@shared/actor';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {CompanyDomainEvent} from '../../domain/company/events';
import {DomainEvent, Event} from '../../domain/event';
import {EventRepository, EventSearchFilter, EventSortOptions} from '../../domain/event/event.repository';
import {EventType} from '../../domain/event/event.type';
import type {EventModel as EventDomainModel, EventPayloadMap} from '../../domain/event/models/event.model';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type EventDbModel = PrismaClient.Event;

export type EventModel = Override<Omit<EventDbModel, 'id'>, {payload: NonNullable<Prisma.JsonValue>}>;

@Injectable()
export class EventPrismaRepository extends PrismaRepository implements EventRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize<T extends EventType>(event: EventDbModel): EventDomainModel<T> {
        return {
            id: event.id,
            type: event.type as T,
            payload: event.payload as EventPayloadMap[T],
            timestamp: event.timestamp,
        };
    }

    private static denormalize(event: Event<DomainEvent, MaybeAuthenticatedActor>): EventModel {
        const {actor, payload: domainEvent} = event;
        const {type, timestamp, companyId, ...payload} =
            domainEvent instanceof CompanyDomainEvent
                ? domainEvent
                : (domainEvent as DomainEvent & {companyId: undefined});

        return {
            type,
            payload: JSON.parse(JSON.stringify(payload)) as EventModel['payload'],
            userIp: actor.ip,
            userId: actor.userId?.toString() ?? null,
            companyId: companyId?.toJSON() ?? null,
            timestamp,
        };
    }

    async add(event: Event<DomainEvent, MaybeAuthenticatedActor>): Promise<void> {
        const eventModel = EventPrismaRepository.denormalize(event);

        await this.prisma.event.create({
            data: eventModel,
        });
    }

    async search<T extends EventType>(
        companyId: CompanyId,
        pagination: Pagination<EventSortOptions>,
        filter: EventSearchFilter<T> = {}
    ): Promise<PaginatedList<EventDomainModel<T>>> {
        const where: Prisma.EventWhereInput = {
            companyId: companyId.toString(),
            type: {
                in: filter.type,
            },
        };

        const [events, totalCount] = await Promise.all([
            this.prisma.event.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: parseInt(pagination.cursor, 10),
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.event.count({where}),
        ]);

        return {
            data: events.slice(0, pagination.limit).map((event) => EventPrismaRepository.normalize(event)),
            totalCount,
            nextCursor: events.length > pagination.limit ? events[events.length - 1].id.toString() : null,
        };
    }
}
