import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {Reservation} from '../../../domain/reservation/entities';
import {fakeReservation} from '../../../domain/reservation/entities/__tests__/fake-reservation';
import type {ReservationSearchFilter, ReservationSortOptions} from '../../../domain/reservation/reservation.repository';
import {UserId} from '../../../domain/user/entities';
import type {PrismaService} from '../prisma';
import type {ReservationModel} from '../reservation.prisma.repository';
import {ReservationPrismaRepository} from '../reservation.prisma.repository';

describe('A reservation repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new ReservationPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainReservations: Reservation[] = [
        fakeReservation({
            companyId,
            roomCategoryId: null,
            checkIn: new Date(600),
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: null,
            createdAt: new Date(50),
            updatedAt: new Date(50),
        }),
        fakeReservation({
            companyId,
            roomId: null,
            checkIn: new Date(500),
            canceledAt: new Date(200),
            canceledBy: UserId.generate(),
            canceledReason: 'reason',
            noShow: false,
            note: null,
            createdAt: new Date(100),
            updatedAt: new Date(200),
        }),
    ];

    const databaseReservations: ReservationModel[] = [
        {
            id: domainReservations[0].id.toString(),
            companyId: domainReservations[0].companyId.toString(),
            roomId: domainReservations[0].roomId?.toString() ?? null,
            roomCategoryId: domainReservations[0].roomCategoryId?.toString() ?? null,
            checkIn: domainReservations[0].checkIn,
            bookedById: domainReservations[0].bookedBy.toString(),
            bookedForId: domainReservations[0].bookedFor.toString(),
            canceledAt: domainReservations[0].canceledAt,
            canceledById: domainReservations[0].canceledBy?.toString() ?? null,
            canceledReason: domainReservations[0].canceledReason,
            noShow: domainReservations[0].noShow,
            note: domainReservations[0].note,
            createdAt: domainReservations[0].createdAt,
            updatedAt: domainReservations[0].updatedAt,
        },
        {
            id: domainReservations[1].id.toString(),
            companyId: domainReservations[1].companyId.toString(),
            roomId: domainReservations[1].roomId?.toString() ?? null,
            roomCategoryId: domainReservations[1].roomCategoryId?.toString() ?? null,
            checkIn: domainReservations[1].checkIn,
            bookedById: domainReservations[1].bookedBy.toString(),
            bookedForId: domainReservations[1].bookedFor.toString(),
            canceledAt: domainReservations[1].canceledAt,
            canceledById: domainReservations[1].canceledBy?.toString() ?? null,
            canceledReason: domainReservations[1].canceledReason,
            noShow: domainReservations[1].noShow,
            note: domainReservations[1].note,
            createdAt: domainReservations[1].createdAt,
            updatedAt: domainReservations[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseReservations[0], domainReservations[0]],
    ])('should find a reservation by ID', async (databaseReservation, domainReservation) => {
        jest.spyOn(prisma.reservation, 'findUnique').mockResolvedValueOnce(databaseReservation);

        await expect(repository.findById(domainReservations[0].id)).resolves.toEqual(domainReservation);

        expect(prisma.reservation.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.reservation.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainReservations[0].id.toString(),
            },
        });
    });

    it('should search reservations', async () => {
        const pagination: Pagination<ReservationSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: ReservationSearchFilter = {
            checkIn: {
                from: new Date(100),
                to: new Date(100),
            },
            canceledAt: {
                from: new Date(150),
                to: new Date(200),
            },
        };

        jest.spyOn(prisma.reservation, 'findMany').mockResolvedValueOnce(databaseReservations);
        jest.spyOn(prisma.reservation, 'count').mockResolvedValueOnce(databaseReservations.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainReservations,
            totalCount: databaseReservations.length,
            nextCursor: null,
        });

        expect(prisma.reservation.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.reservation.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                canceledAt: {gte: new Date(150), lte: new Date(200)},
                checkIn: {gte: new Date(100), lte: new Date(100)},
            },
            take: 6,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
        expect(prisma.reservation.count).toHaveBeenCalledTimes(1);
        expect(prisma.reservation.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                canceledAt: {gte: new Date(150), lte: new Date(200)},
                checkIn: {gte: new Date(100), lte: new Date(100)},
            },
        });
    });

    it('should paginate reservations', async () => {
        const pagination: Pagination<ReservationSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.reservation, 'findMany').mockResolvedValueOnce(
            databaseReservations.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.reservation, 'count').mockResolvedValueOnce(databaseReservations.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainReservations[0]],
            totalCount: databaseReservations.length,
            nextCursor: databaseReservations[1].id,
        });

        expect(prisma.reservation.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should save a reservation', async () => {
        jest.spyOn(prisma.reservation, 'upsert');

        await repository.save(domainReservations[1]);

        expect(prisma.reservation.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.reservation.upsert).toHaveBeenCalledWith({
            where: {
                id: domainReservations[1].id.toString(),
            },
            create: databaseReservations[1],
            update: databaseReservations[1],
        });
    });

    it('should throw an unknown error when saving a reservation', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.reservation, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainReservations[0])).rejects.toThrow(error);
    });
});
