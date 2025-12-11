import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {MaybeAuthenticatedActor} from '../../domain/@shared/actor';
import type {DomainEvent, Event} from '../../domain/event';
import type {EventType} from '../../domain/event/event.type';
import type {EventModel as EventDomainModel, EventPayloadMap} from '../../domain/event/models/event.model';
import {ProfessionalDomainEvent} from '../../domain/professional/events';
import {MapperWithoutDto} from './mapper';

export type EventDbModel = PrismaClient.Event;

export type EventModel = Override<Omit<EventDbModel, 'id'>, {payload: NonNullable<Prisma.JsonValue>}>;

@Injectable()
export class EventMapper extends MapperWithoutDto<unknown, unknown> {
    toDomain<T extends EventType>(event: EventDbModel): EventDomainModel<T> {
        return {
            id: event.id,
            type: event.type as T,
            payload: event.payload as EventPayloadMap[T],
            timestamp: event.timestamp,
        };
    }

    toPersistence(event: Event<DomainEvent, MaybeAuthenticatedActor>): EventModel {
        const {actor, payload: domainEvent} = event;
        const {type, timestamp, professionalId, ...payload} =
            domainEvent instanceof ProfessionalDomainEvent
                ? domainEvent
                : (domainEvent as DomainEvent & {professionalId: undefined});

        return {
            type,
            payload: JSON.parse(JSON.stringify(payload)) as EventModel['payload'],
            userIp: actor.ip,
            userId: actor.userId?.toString() ?? null,
            professionalId: professionalId?.toJSON() ?? null,
            timestamp,
        };
    }
}
