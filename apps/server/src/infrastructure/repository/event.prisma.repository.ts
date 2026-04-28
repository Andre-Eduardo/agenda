import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {MaybeAuthenticatedActor} from '../../domain/@shared/actor';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {ClinicId} from '../../domain/clinic/entities';
import {DomainEvent, Event} from '../../domain/event';
import {EventRepository, EventSearchFilter, EventSortOptions} from '../../domain/event/event.repository';
import {EventType} from '../../domain/event/event.type';
import type {EventModel as EventDomainModel} from '../../domain/event/models/event.model';
import {EventMapper} from '../mappers';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type EventDbModel = PrismaClient.Event;

export type EventModel = Override<Omit<EventDbModel, 'id'>, {payload: NonNullable<Prisma.JsonValue>}>;

@Injectable()
export class EventPrismaRepository extends PrismaRepository implements EventRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        readonly mapper: EventMapper,
    ) {
        super(prismaProvider);
    }

    async add(event: Event<DomainEvent, MaybeAuthenticatedActor>): Promise<void> {
        const eventModel = this.mapper.toPersistence(event);

        await this.prisma.event.create({
            data: eventModel,
        });
    }

    async search<T extends EventType>(
        clinicId: ClinicId,
        pagination: Pagination<EventSortOptions>,
        filter: EventSearchFilter<T> = {},
    ): Promise<PaginatedList<EventDomainModel<T>>> {
        const where: Prisma.EventWhereInput = {
            clinicId: clinicId.toString(),
            type: {
                in: filter.type,
            },
        };

        const [events, totalCount] = await Promise.all([
            this.prisma.event.findMany({
                where,
                ...this.normalizePagination(pagination, {id: 'asc'}),
            }),
            this.prisma.event.count({where}),
        ]);

        return {
            data: events.map((event) => this.mapper.toDomain(event)),
            totalCount,
        };
    }
}
