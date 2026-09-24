import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '@domain/@shared/repository';
import {
    AppointmentRepository,
    AppointmentSearchFilter,
    AppointmentSortOptions,
} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentId} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {RoomId} from '@domain/room/entities';
import {AppointmentMapper} from '@infrastructure/mappers/appointment.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentPrismaRepository extends PrismaRepository implements AppointmentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: AppointmentId): Promise<Appointment | null> {
        const appointment = await this.prisma.appointment.findFirst({
            where: {id: id.toString(), deletedAt: null, patient: {deletedAt: null}},
        });

        return appointment === null ? null : this.mapper.toDomain(appointment);
    }

    async delete(id: AppointmentId): Promise<void> {
        await this.prisma.appointment.updateMany({
            where: {id: id.toString(), deletedAt: null},
            data: this.softDeleteData(),
        });
    }

    async search(
        pagination: Pagination<AppointmentSortOptions>,
        filter: AppointmentSearchFilter = {}
    ): Promise<PaginatedList<Appointment>> {
        const patientIds = filter.patientIds?.map((id) => id.toString());
        const where: PrismaClient.Prisma.AppointmentWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
            attendedByMemberId: filter.attendedByMemberId ? filter.attendedByMemberId.toString() : undefined,
            createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
            patientId: filter.patientId?.toString() ?? (patientIds ? {in: patientIds} : undefined),
            status: filter.status ? {in: filter.status} : undefined,
            startAt: filter.dateFrom || filter.dateTo ? {gte: filter.dateFrom, lte: filter.dateTo} : undefined,
            note: filter.term ? {contains: filter.term, mode: 'insensitive'} : undefined,
            deletedAt: null,
            patient: {deletedAt: null},
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.appointment.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(appointment: Appointment): Promise<void> {
        const data = this.mapper.toPersistence(appointment);

        await this.prisma.appointment.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async findConflicts(
        attendedByMemberId: ClinicMemberId,
        startAt: Date,
        endAt: Date,
        excludeId?: AppointmentId
    ): Promise<Appointment[]> {
        const records = await this.prisma.appointment.findMany({
            where: {
                attendedByMemberId: attendedByMemberId.toString(),
                id: excludeId ? {not: excludeId.toString()} : undefined,
                status: {notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']},
                startAt: {lt: endAt},
                endAt: {gt: startAt},
                deletedAt: null,
                patient: {deletedAt: null},
            },
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async findRoomConflicts(
        roomId: RoomId,
        startAt: Date,
        endAt: Date,
        excludeId?: AppointmentId
    ): Promise<Appointment[]> {
        const records = await this.prisma.appointment.findMany({
            where: {
                roomId: roomId.toString(),
                id: excludeId ? {not: excludeId.toString()} : undefined,
                status: {notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']},
                startAt: {lt: endAt},
                endAt: {gt: startAt},
                deletedAt: null,
                patient: {deletedAt: null},
            },
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    // pg_advisory_xact_lock returns void, which $queryRaw cannot deserialize (P2010 on Prisma 6.19),
    // so the lock is taken with $executeRaw, which does not read the result column.
    async lockMemberSchedule(attendedByMemberId: ClinicMemberId): Promise<void> {
        await this.prisma
            .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointment-member:${attendedByMemberId.toString()}`}))`;
    }

    async lockRoomSchedule(roomId: RoomId): Promise<void> {
        await this.prisma
            .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointment-room:${roomId.toString()}`}))`;
    }
}
