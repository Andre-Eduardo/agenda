import type PrismaClient from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import type {Pagination} from '@domain/@shared/repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import type {EventSearchFilter, EventSortOptions} from '@domain/event/event.repository';
import type {EventType} from '@domain/event/event.type';
import {UserId} from '@domain/user/entities';
import {UserClinicMemberAddedEvent, UserClinicMemberRemovedEvent} from '@domain/user/events';
import {EventMapper} from '@infrastructure/mappers/event.mapper';
import {EventPrismaRepository} from '@infrastructure/repository/event.prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';
import {PrismaService} from '@infrastructure/repository/prisma/prisma.service';

describe('An event Prisma repository', () => {
    const prisma = mockDeep<PrismaService>();
    const prismaProvider = mockDeep<PrismaProvider>();

    Object.defineProperty(prismaProvider, 'client', {get: () => prisma});

    const mapper = new EventMapper();
    const repository = new EventPrismaRepository(prismaProvider, mapper);

    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const clinicMemberId = ClinicMemberId.generate();

    const databaseEvents: PrismaClient.Event[] = [
        {
            id: 1,
            clinicId: actor.clinicId.toString(),
            memberId: actor.clinicMemberId.toString(),
            type: UserClinicMemberAddedEvent.type,
            payload: {userId: actor.userId.toString(), clinicMemberId: clinicMemberId.toString()},
            userIp: actor.ip,
            timestamp: new Date(1000),
        },
        {
            id: 2,
            clinicId: actor.clinicId.toString(),
            memberId: actor.clinicMemberId.toString(),
            type: UserClinicMemberRemovedEvent.type,
            payload: {userId: actor.userId.toString(), clinicMemberId: clinicMemberId.toString()},
            userIp: actor.ip,
            timestamp: new Date(2000),
        },
    ];

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add an event', async () => {
        const payload = new UserClinicMemberAddedEvent({
            userId: actor.userId,
            clinicMemberId,
            timestamp: new Date(1000),
        });

        await repository.add({actor, payload});

        expect(prisma.event.create).toHaveBeenCalledWith({
            data: {
                type: UserClinicMemberAddedEvent.type,
                payload: {userId: actor.userId.toString(), clinicMemberId: clinicMemberId.toString()},
                userIp: actor.ip,
                clinicId: actor.clinicId.toString(),
                memberId: actor.clinicMemberId.toString(),
                timestamp: new Date(1000),
            },
        });
    });

    it('should add an event without an authenticated actor', async () => {
        const payload = new UserClinicMemberAddedEvent({
            userId: actor.userId,
            clinicMemberId,
            timestamp: new Date(1000),
        });

        await repository.add({actor: {userId: null, clinicId: null, clinicMemberId: null, ip: '0.0.0.0'}, payload});

        expect(prisma.event.create).toHaveBeenCalledWith({
            data: expect.objectContaining({clinicId: null, memberId: null, userIp: '0.0.0.0'}),
        });
    });

    it('should search events', async () => {
        const pagination: Pagination<EventSortOptions> = {
            limit: 10,
            sort: [{key: 'timestamp', direction: 'asc'}],
        };

        const filter: EventSearchFilter<EventType> = {
            type: [UserClinicMemberAddedEvent.type, UserClinicMemberRemovedEvent.type],
        };

        prisma.event.findMany.mockResolvedValueOnce(databaseEvents);
        prisma.event.count.mockResolvedValueOnce(databaseEvents.length);

        const result = await repository.search(actor.clinicId, pagination, filter);

        expect(result).toEqual({
            data: databaseEvents.map(({id, type, payload, timestamp}) => ({id, type, payload, timestamp})),
            totalCount: databaseEvents.length,
        });

        const where = {clinicId: actor.clinicId.toString(), type: {in: filter.type}};

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where,
            skip: undefined,
            take: 10,
            orderBy: [{timestamp: 'asc'}, {id: 'asc'}],
        });
        expect(prisma.event.count).toHaveBeenCalledWith({where});
    });
});
