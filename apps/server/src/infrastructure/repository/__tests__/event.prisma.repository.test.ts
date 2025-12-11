import {mockDeep} from 'jest-mock-extended';
import type PrismaClient from '@prisma/client';
import {EventPrismaRepository} from '../index';
import {PrismaService} from '../prisma';
import {ProfessionalId} from '../../../domain/professional/entities';
import {User, UserId} from '../../../domain/user/entities';
import {UserSignedUpEvent, UserProfessionalAddedEvent, UserProfessionalRemovedEvent} from '../../../domain/user/events';
import {Username} from '../../../domain/user/value-objects';
import {Email} from '../../../domain/@shared/value-objects';
import {Pagination} from '../../../domain/@shared/repository';
import {EventSortOptions, EventSearchFilter} from '../../../domain/event/event.repository';
import {EventType} from '../../../domain/event/event.type';
import {EventModel} from '../../../domain/event/models/event.model';

import {EventMapper} from '../../../infrastructure/mappers/event.mapper';

import {PrismaProvider} from '../prisma/prisma.provider';

describe('EventPrismaRepository', () => {
    const prisma = mockDeep<PrismaService>();
    const prismaProvider = mockDeep<PrismaProvider>();
    Object.defineProperty(prismaProvider, 'client', {get: () => prisma});

    const mapper = new EventMapper();
    const repository = new EventPrismaRepository(prismaProvider, mapper);
    const professionalId = ProfessionalId.generate();

    let user: User;
    let events: any[];
    let databaseEvents: PrismaClient.Event[];
    let eventSearchResult: EventModel[];

    beforeAll(async () => {
        user = await User.create({
            username: Username.create('john_doe'),
            email: Email.create('john_doe@example.com'),
            password: 'Pa$$w0rd' as any,
            name: 'John Doe',
            professionals: [professionalId],
        });

        events = [
            new UserProfessionalAddedEvent({
                professionalId,
                userId: user.id,
                timestamp: new Date(1000),
            }),
            new UserProfessionalRemovedEvent({
                professionalId,
                userId: user.id,
                timestamp: new Date(2000),
            }),
        ];

        databaseEvents = [
            {
                id: 1,
                type: UserProfessionalAddedEvent.type,
                payload: {user: user.toJSON(), professionalId: professionalId.toString()} as any,
                userIp: '127.0.0.1',
                userId: user.id.toString(),
                professionalId: professionalId.toString(),
                timestamp: new Date(1000),
            },
            {
                id: 2,
                type: UserProfessionalRemovedEvent.type,
                payload: {user: user.toJSON(), professionalId: professionalId.toString()} as any,
                userIp: '127.0.0.1',
                userId: user.id.toString(),
                professionalId: professionalId.toString(),
                timestamp: new Date(2000),
            },
        ];

        eventSearchResult = [
            {
                id: 1,
                type: UserProfessionalAddedEvent.type,
                payload: {user: user.toJSON(), professionalId: professionalId.toString()} as any,
                timestamp: new Date(1000),
            },
            {
                id: 2,
                type: UserProfessionalRemovedEvent.type,
                payload: {user: user.toJSON(), professionalId: professionalId.toString()} as any,
                timestamp: new Date(2000),
            },
        ];
    });

    it('should add an event', async () => {
        const event = {
            actor: {userId: user.id, ip: '127.0.0.1'},
            payload: events[0],
        };

        await repository.add(event);

        expect(prisma.event.create).toHaveBeenCalledWith({
            data: {
                type: UserProfessionalAddedEvent.type,
                payload: expect.anything(),
                userIp: '127.0.0.1',
                userId: user.id.toString(),
                professionalId: professionalId.toString(),
                timestamp: events[0].timestamp,
            },
        });
    });

    it('should search events', async () => {
        const pagination: Pagination<EventSortOptions> = {
            limit: 10,
            sort: [
                {
                    key: 'timestamp',
                    direction: 'asc',
                },
            ],
        };

        const filter: EventSearchFilter<EventType> = {
            type: [UserProfessionalAddedEvent.type],
        };

        (prisma.event.findMany as any).mockResolvedValueOnce(databaseEvents);
        (prisma.event.count as any).mockResolvedValueOnce(databaseEvents.length);

        const result = await repository.search(professionalId, pagination, filter);

        expect(result).toEqual({
            data: eventSearchResult,
            totalCount: databaseEvents.length,
        });
    });
});
