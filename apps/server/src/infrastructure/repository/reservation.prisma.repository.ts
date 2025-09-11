import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {PersonId} from '../../domain/person/entities';
import {Reservation, ReservationId} from '../../domain/reservation/entities';
import {
    ReservationRepository,
    ReservationSearchFilter,
    ReservationSortOptions,
} from '../../domain/reservation/reservation.repository';
import {RoomId} from '../../domain/room/entities';
import {RoomCategoryId} from '../../domain/room-category/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type ReservationModel = PrismaClient.Reservation;

@Injectable()
export class ReservationPrismaRepository extends PrismaRepository implements ReservationRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(reservation: ReservationModel): Reservation {
        return new Reservation({
            ...reservation,
            id: ReservationId.from(reservation.id),
            companyId: CompanyId.from(reservation.companyId),
            roomId: reservation.roomId ? RoomId.from(reservation.roomId) : null,
            roomCategoryId: reservation.roomCategoryId ? RoomCategoryId.from(reservation.roomCategoryId) : null,
            bookedBy: UserId.from(reservation.bookedById),
            bookedFor: PersonId.from(reservation.bookedForId),
            canceledBy: reservation.canceledById ? UserId.from(reservation.canceledById) : null,
        });
    }

    private static denormalize(reservation: Reservation): ReservationModel {
        return {
            id: reservation.id.toString(),
            companyId: reservation.companyId.toString(),
            roomId: reservation.roomId?.toString() ?? null,
            roomCategoryId: reservation.roomCategoryId?.toString() ?? null,
            checkIn: reservation.checkIn,
            bookedById: reservation.bookedBy.toString(),
            bookedForId: reservation.bookedFor.toString(),
            canceledAt: reservation.canceledAt,
            canceledById: reservation.canceledBy?.toString() ?? null,
            canceledReason: reservation.canceledReason,
            noShow: reservation.noShow,
            note: reservation.note,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        };
    }

    async findById(id: ReservationId): Promise<Reservation | null> {
        const reservation = await this.prisma.reservation.findUnique({
            where: {id: id.toString()},
        });

        return reservation === null ? null : ReservationPrismaRepository.normalize(reservation);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<ReservationSortOptions>,
        filter: ReservationSearchFilter = {}
    ): Promise<PaginatedList<Reservation>> {
        const where: Prisma.ReservationWhereInput = {
            companyId: companyId.toString(),
            roomId: filter.roomId?.toString(),
            roomCategoryId: filter.roomCategoryId?.toString(),
            checkIn: filter.checkIn === undefined ? undefined : {gte: filter.checkIn.from, lte: filter.checkIn.to},
            bookedById: filter.bookedBy?.toString(),
            bookedForId: filter.bookedFor?.toString(),
            canceledAt:
                filter.canceledAt == null
                    ? filter.canceledAt
                    : {gte: filter.canceledAt.from, lte: filter.canceledAt.to},
            canceledById: filter.canceledBy?.toString(),
            noShow: filter.noShow,
        };

        const [reservations, totalCount] = await Promise.all([
            this.prisma.reservation.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.reservation.count({where}),
        ]);

        return {
            data: reservations
                .slice(0, pagination.limit)
                .map((reservation) => ReservationPrismaRepository.normalize(reservation)),
            totalCount,
            nextCursor: reservations.length > pagination.limit ? reservations[reservations.length - 1].id : null,
        };
    }

    async save(reservation: Reservation): Promise<void> {
        const reservationModel = ReservationPrismaRepository.denormalize(reservation);

        await this.prisma.reservation.upsert({
            where: {
                id: reservationModel.id,
            },
            create: reservationModel,
            update: reservationModel,
        });
    }
}
