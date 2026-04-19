import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {MaybeAuthenticatedActor} from '../../domain/@shared/actor';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {DomainEvent, Event} from '../../domain/event';
import {EventRepository, EventSearchFilter, EventSortOptions} from '../../domain/event/event.repository';
import {EventType} from '../../domain/event/event.type';
import type {EventModel as EventDomainModel, EventPayloadMap} from '../../domain/event/models/event.model';
import {ProfessionalId} from '../../domain/professional/entities';
import {EventMapper} from '../mappers';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type EventDbModel = PrismaClient.Event;

export type EventModel = Override<Omit<EventDbModel, 'id'>, {payload: NonNullable<Prisma.JsonValue>}>;

@Injectable()
export class EventPrismaRepository extends PrismaRepository implements EventRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        readonly mapper: EventMapper
    ) {
        super(prismaProvider);
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

        // Alguns DomainEvents carregam um `professionalId` opcional diretamente no evento —
        // quando presente, é extraído para a coluna dedicada e removido do payload.
        const professionalId = EventPrismaRepository.extractProfessionalId(domainEvent);

        const {type, timestamp, ...rest} = domainEvent;
        const payload: Record<string, unknown> = {...rest};
        if ('professionalId' in payload) {
            delete payload.professionalId;
        }

        return {
            type,
            payload: JSON.parse(JSON.stringify(payload)) as EventModel['payload'],
            userIp: actor.ip,
            userId: actor.userId?.toString() ?? null,
            professionalId: professionalId?.toString() ?? null,
            timestamp,
        };
    }

    /** Lê de forma type-safe o `professionalId` quando o DomainEvent o expõe. */
    private static extractProfessionalId(domainEvent: DomainEvent): ProfessionalId | null {
        if (!('professionalId' in domainEvent)) return null;
        const candidate = (domainEvent as {professionalId: unknown}).professionalId;
        if (candidate instanceof ProfessionalId) {
            return candidate;
        }
        if (typeof candidate === 'string' && candidate.length > 0) {
            return ProfessionalId.from(candidate);
        }
        return null;
    }

    async add(event: Event<DomainEvent, MaybeAuthenticatedActor>): Promise<void> {
        const eventModel = EventPrismaRepository.denormalize(event);

        await this.prisma.event.create({
            data: eventModel,
        });
    }

    async search<T extends EventType>(
        professionalId: ProfessionalId,
        pagination: Pagination<EventSortOptions>,
        filter: EventSearchFilter<T> = {}
    ): Promise<PaginatedList<EventDomainModel<T>>> {
        const where: Prisma.EventWhereInput = {
            professionalId: professionalId.toString(),
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
