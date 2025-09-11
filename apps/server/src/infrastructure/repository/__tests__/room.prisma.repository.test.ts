import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {Room} from '../../../domain/room/entities';
import {fakeRoom} from '../../../domain/room/entities/__tests__/fake-room';
import {RoomState} from '../../../domain/room/models/room-state';
import {DuplicateNumberException} from '../../../domain/room/room.exceptions';
import type {RoomSortOptions} from '../../../domain/room/room.repository';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import type {RoomModel} from '../index';
import {RoomPrismaRepository} from '../index';
import type {PrismaService} from '../prisma';

describe('A room repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new RoomPrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainRooms: Room[] = [
        fakeRoom({
            number: 1,
            name: 'Room 101',
            state: RoomState.VACANT,
            stateSnapshot: null,
        }),
        fakeRoom({
            number: 2,
            name: 'Room 102',
            state: RoomState.OCCUPIED,
            stateSnapshot: {foo: 'bar'},
        }),
    ];

    const databaseRooms: RoomModel[] = [
        {
            id: domainRooms[0].id.toString(),
            companyId: domainRooms[0].companyId.toString(),
            categoryId: domainRooms[0].categoryId.toString(),
            number: domainRooms[0].number,
            name: domainRooms[0].name,
            state: domainRooms[0].state,
            stateSnapshot: domainRooms[0].stateSnapshot as RoomModel['stateSnapshot'],
            createdAt: domainRooms[0].createdAt,
            updatedAt: domainRooms[0].updatedAt,
        },
        {
            id: domainRooms[1].id.toString(),
            companyId: domainRooms[1].companyId.toString(),
            categoryId: domainRooms[1].categoryId.toString(),
            number: domainRooms[1].number,
            name: domainRooms[1].name,
            state: domainRooms[1].state,
            stateSnapshot: domainRooms[1].stateSnapshot as RoomModel['stateSnapshot'],
            createdAt: domainRooms[1].createdAt,
            updatedAt: domainRooms[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseRooms[0], domainRooms[0]],
    ])('should find a room by ID', async (databaseRoom, domainRoom) => {
        jest.spyOn(prisma.room, 'findUnique').mockResolvedValueOnce(databaseRoom);

        await expect(repository.findById(domainRooms[0].id)).resolves.toEqual(domainRoom);

        expect(prisma.room.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.room.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainRooms[0].id.toString(),
            },
        });
    });

    it('should find all rooms', async () => {
        jest.spyOn(prisma.room, 'findMany').mockResolvedValueOnce(databaseRooms);

        await expect(repository.findAll()).resolves.toEqual(domainRooms);

        expect(prisma.room.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.room.findMany).toHaveBeenCalledWith();
    });

    it('should search rooms', async () => {
        const pagination: Pagination<RoomSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter = {
            name: 'Room',
            number: undefined,
            categoryId: undefined,
        };

        jest.spyOn(prisma.room, 'findMany').mockResolvedValueOnce(databaseRooms);
        jest.spyOn(prisma.room, 'count').mockResolvedValueOnce(databaseRooms.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainRooms,
            totalCount: databaseRooms.length,
            nextCursor: null,
        });

        expect(prisma.room.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.room.findMany).toHaveBeenCalledWith({
            where: {
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
                number: undefined,
                categoryId: undefined,
                companyId: companyId.toString(),
            },
            take: pagination.limit + 1,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate rooms', async () => {
        const pagination: Pagination<RoomSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter = {
            name: 'Room',
            number: 1,
            categoryId: RoomCategoryId.generate(),
        };

        jest.spyOn(prisma.room, 'findMany').mockResolvedValueOnce(databaseRooms.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.room, 'count').mockResolvedValueOnce(databaseRooms.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainRooms[0]],
            totalCount: databaseRooms.length,
            nextCursor: databaseRooms[1].id,
        });

        expect(prisma.room.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter?.name,
                },
                number: filter.number,
                categoryId: filter.categoryId.toString(),
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [{id: 'asc'}],
        });
    });

    it.each([
        [
            domainRooms[0],
            {
                ...databaseRooms[0],
                stateSnapshot: Prisma.DbNull,
            },
        ],
        [domainRooms[1], databaseRooms[1]],
    ])('should save a room', async (domainRoom, databaseRoom) => {
        jest.spyOn(prisma.room, 'upsert');

        await repository.save(domainRoom);

        expect(prisma.room.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.room.upsert).toHaveBeenCalledWith({
            where: {
                id: databaseRoom.id,
            },
            create: databaseRoom,
            update: databaseRoom,
        });
    });

    it('should throw an exception when saving a room with a duplicate number', async () => {
        jest.spyOn(prisma.room, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['number'],
                },
            })
        );

        await expect(repository.save(domainRooms[1])).rejects.toThrowWithMessage(
            DuplicateNumberException,
            'Duplicate room number.'
        );
    });

    it('should rethrow an unknown error when saving a room', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.room, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainRooms[1])).rejects.toThrow(error);
    });

    it('should delete a room', async () => {
        jest.spyOn(prisma.room, 'delete').mockResolvedValueOnce(databaseRooms[0]);

        await expect(repository.delete(domainRooms[0].id)).resolves.toBeUndefined();

        expect(prisma.room.delete).toHaveBeenCalledTimes(1);
        expect(prisma.room.delete).toHaveBeenCalledWith({
            where: {
                id: domainRooms[0].id.toString(),
            },
        });
    });
});
