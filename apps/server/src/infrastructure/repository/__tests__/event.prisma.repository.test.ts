import type PrismaClient from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {MaybeAuthenticatedActor} from '../../../domain/@shared/actor';
import type {Pagination} from '../../../domain/@shared/repository';
import {Email} from '../../../domain/@shared/value-objects';
import {CompanyId} from '../../../domain/company/entities';
import {fakeDefectType} from '../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {DefectTypeCreatedEvent} from '../../../domain/defect-type/events';
import type {DomainEvent, Event} from '../../../domain/event';
import type {EventSearchFilter, EventSortOptions} from '../../../domain/event/event.repository';
import type {EventType} from '../../../domain/event/event.type';
import type {EventModel, EventPayloadMap} from '../../../domain/event/models/event.model';
import {fakeRoom} from '../../../domain/room/entities/__tests__/fake-room';
import {RoomCreatedEvent} from '../../../domain/room/events';
import {User, UserId} from '../../../domain/user/entities';
import {UserSignedUpEvent} from '../../../domain/user/events';
import {Username} from '../../../domain/user/value-objects';
import type {EventModel as EventDbModel} from '../index';
import {EventPrismaRepository} from '../index';
import type {PrismaService} from '../prisma';

describe('An event repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new EventPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const room = fakeRoom();
    const defectType = fakeDefectType();

    const events: Array<Event<DomainEvent, MaybeAuthenticatedActor>> = [
        {
            actor: {
                userId: UserId.generate(),
                ip: '127.0.0.1',
            },
            payload: new RoomCreatedEvent({companyId, room, timestamp: new Date(1000)}),
        },
        {
            actor: {
                userId: null,
                ip: '127.0.0.1',
            },
            payload: new RoomCreatedEvent({companyId, room, timestamp: new Date(1000)}),
        },
        {
            actor: {
                userId: UserId.generate(),
                ip: '127.0.0.1',
            },
            payload: new DefectTypeCreatedEvent({companyId, defectType, timestamp: new Date(1000)}),
        },
    ];

    const eventModels: EventDbModel[] = [
        {
            type: events[0].payload.type,
            payload: {room: room.toJSON()},
            userIp: events[0].actor.ip,
            userId: events[0].actor.userId!.toString(),
            companyId: companyId.toString(),
            timestamp: events[0].payload.timestamp,
        },
        {
            type: events[1].payload.type,
            payload: {room: room.toJSON()},
            userIp: events[1].actor.ip,
            userId: null,
            companyId: companyId.toString(),
            timestamp: events[1].payload.timestamp,
        },
        {
            type: events[2].payload.type,
            payload: {defectType: defectType.toJSON()},
            userIp: events[2].actor.ip,
            userId: events[2].actor.userId!.toString(),
            companyId: companyId.toString(),
            timestamp: events[2].payload.timestamp,
        },
    ];

    const databaseEvents: PrismaClient.Event[] = eventModels.map((event, index) => ({
        id: index + 1,
        ...event,
    }));

    const eventSearchResult: EventModel[] = [
        {
            id: databaseEvents[0].id,
            type: RoomCreatedEvent.type,
            payload: databaseEvents[0].payload as EventPayloadMap[typeof RoomCreatedEvent.type],
            timestamp: databaseEvents[0].timestamp,
        },
        {
            id: databaseEvents[1].id,
            type: RoomCreatedEvent.type,
            payload: databaseEvents[1].payload as EventPayloadMap[typeof RoomCreatedEvent.type],
            timestamp: databaseEvents[1].timestamp,
        },
        {
            id: databaseEvents[2].id,
            type: DefectTypeCreatedEvent.type,
            payload: databaseEvents[2].payload as EventPayloadMap[typeof DefectTypeCreatedEvent.type],
            timestamp: databaseEvents[2].timestamp,
        },
    ];

    it.each([
        [events[0], eventModels[0]],
        [events[1], eventModels[1]],
    ])('should add an event', async (event, databaseEvent) => {
        jest.spyOn(prisma.event, 'create');

        await repository.add(event);

        expect(prisma.event.create).toHaveBeenCalledTimes(1);
        expect(prisma.event.create).toHaveBeenCalledWith({
            data: databaseEvent,
        });
    });

    it('should add an event without a company', async () => {
        const user = await User.signUp({
            username: Username.create('john_doe'),
            email: Email.create('john_doe@example.com'),
            password: 'Pa$$w0rd',
            firstName: 'John',
        });

        const event: Event = {
            actor: {
                userId: UserId.generate(),
                ip: '127.0.0.1',
            },
            payload: new UserSignedUpEvent({user, timestamp: new Date(1000)}),
        };

        jest.spyOn(prisma.event, 'create');

        await repository.add(event);

        expect(prisma.event.create).toHaveBeenCalledTimes(1);
        expect(prisma.event.create).toHaveBeenCalledWith({
            data: {
                type: UserSignedUpEvent.type,
                payload: {user: user.toJSON()},
                userIp: event.actor.ip,
                userId: event.actor.userId?.toString(),
                companyId: null,
                timestamp: event.payload.timestamp,
            },
        });
    });

    it('should search events', async () => {
        const pagination: Pagination<EventSortOptions> = {
            limit: 10,
            sort: {
                timestamp: 'asc',
            },
        };

        const filter: EventSearchFilter<EventType> = {
            type: [RoomCreatedEvent.type],
        };

        jest.spyOn(prisma.event, 'findMany').mockResolvedValueOnce(databaseEvents);
        jest.spyOn(prisma.event, 'count').mockResolvedValueOnce(databaseEvents.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: eventSearchResult,
            totalCount: databaseEvents.length,
            nextCursor: null,
        });

        expect(prisma.event.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                type: {
                    in: filter.type,
                },
            },
            take: pagination.limit + 1,
            orderBy: [
                {
                    timestamp: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should filter events', async () => {
        const pagination: Pagination<EventSortOptions> = {
            limit: 10,
            sort: {
                timestamp: 'desc',
            },
        };
        const filter: EventSearchFilter<EventType> = {
            type: [DefectTypeCreatedEvent.type],
        };

        jest.spyOn(prisma.event, 'findMany').mockResolvedValueOnce([databaseEvents[2]]);
        jest.spyOn(prisma.event, 'count').mockResolvedValueOnce(1);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [eventSearchResult[2]],
            totalCount: 1,
            nextCursor: null,
        });

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                type: {in: [DefectTypeCreatedEvent.type]},
            },
            take: 11,
            orderBy: [
                {
                    timestamp: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate events', async () => {
        const pagination: Pagination<EventSortOptions> = {
            limit: 2,
            sort: {
                timestamp: 'desc',
            },
        };

        jest.spyOn(prisma.event, 'findMany').mockResolvedValueOnce(databaseEvents.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.event, 'count').mockResolvedValueOnce(databaseEvents.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: eventSearchResult.slice(0, pagination.limit),
            totalCount: 3,
            nextCursor: databaseEvents[2].id.toString(),
        });

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                type: {in: undefined},
            },
            take: 3,
            orderBy: [
                {
                    timestamp: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.event, 'findMany').mockResolvedValueOnce(databaseEvents.slice(2, pagination.limit + 1));
        jest.spyOn(prisma.event, 'count').mockResolvedValueOnce(databaseEvents.length - 1);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: eventSearchResult.slice(2, pagination.limit + 1),
            totalCount: databaseEvents.length - 1,
            nextCursor: null,
        });

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                type: {in: undefined},
            },
            take: 3,
            orderBy: [
                {
                    timestamp: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });
});
