import {randomUUID} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {PaginatedList, Pagination} from '@domain/@shared/repository';
import {toEnum} from '@domain/@shared/utils';
import {
    AppointmentRepository,
    AppointmentSearchFilter,
    AppointmentSortOptions,
    AppointmentStatusTransition,
} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentId, AppointmentStatus} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';
import type {RecordId} from '@domain/record/entities';
import {RoomId} from '@domain/room/entities';
import {UserId} from '@domain/user/entities';
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

    async findFollowUps(clinicId: ClinicId, patientId: PatientId, recordId: RecordId): Promise<Appointment[]> {
        const rows = await this.prisma.appointment.findMany({
            where: {
                clinicId: clinicId.toString(),
                patientId: patientId.toString(),
                followUpFromRecordId: recordId.toString(),
                deletedAt: null,
                patient: {deletedAt: null},
            },
            orderBy: [{startAt: 'desc'}, {id: 'desc'}],
        });

        return rows.map((row) => this.mapper.toDomain(row));
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
            patientId:
                filter.patientId?.toString() ??
                (patientIds && !filter.orAttendedByMemberIds ? {in: patientIds} : undefined),
            OR:
                patientIds && filter.orAttendedByMemberIds
                    ? [
                          {patientId: {in: patientIds}},
                          {attendedByMemberId: {in: filter.orAttendedByMemberIds.map((id) => id.toString())}},
                      ]
                    : undefined,
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

    async saveStatusTransition(
        appointment: Appointment,
        fromStatus: AppointmentStatus,
        actor: Actor,
        reason: string | null
    ): Promise<void> {
        if (appointment.status === fromStatus) {
            throw new PreconditionException('Appointment status did not change.');
        }

        const data = this.mapper.toPersistence(appointment);

        await this.prismaProvider.runAtomically(async () => {
            const {count} = await this.prisma.appointment.updateMany({
                where: {
                    id: data.id,
                    clinicId: actor.clinicId.toString(),
                    status: toEnum(PrismaClient.AppointmentStatus, fromStatus),
                    deletedAt: null,
                },
                data: {
                    status: data.status,
                    canceledAt: data.canceledAt,
                    canceledReason: data.canceledReason,
                    arrivedAt: data.arrivedAt,
                    calledAt: data.calledAt,
                    updatedAt: data.updatedAt,
                },
            });

            if (count !== 1) {
                throw new PreconditionException('Appointment status changed. Reload and try again.');
            }

            const closesQueue =
                fromStatus === AppointmentStatus.ARRIVED ||
                [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED].includes(
                    appointment.status
                );

            if (closesQueue) {
                await this.prisma.patientCallEntry.updateMany({
                    where: {clinicId: actor.clinicId.toString(), appointmentId: data.id, closedAt: null},
                    data: {closedAt: data.updatedAt},
                });
            }

            await this.prisma.appointmentStatusTransition.create({
                data: {
                    id: randomUUID(),
                    clinicId: actor.clinicId.toString(),
                    appointmentId: appointment.id.toString(),
                    actorUserId: actor.userId.toString(),
                    actorMemberId: actor.clinicMemberId.toString(),
                    fromStatus: toEnum(PrismaClient.AppointmentStatus, fromStatus),
                    toStatus: data.status,
                    reason,
                    occurredAt: appointment.updatedAt,
                },
            });
        });
    }

    async listStatusTransitions(
        appointmentId: AppointmentId,
        clinicId: ClinicId
    ): Promise<AppointmentStatusTransition[]> {
        const rows = await this.prisma.appointmentStatusTransition.findMany({
            where: {appointmentId: appointmentId.toString(), clinicId: clinicId.toString()},
            orderBy: [{occurredAt: 'asc'}, {id: 'asc'}],
        });

        return rows.map((row) => ({
            id: row.id,
            clinicId: ClinicId.from(row.clinicId),
            appointmentId: AppointmentId.from(row.appointmentId),
            actorUserId: UserId.from(row.actorUserId),
            actorMemberId: ClinicMemberId.from(row.actorMemberId),
            fromStatus: toEnum(AppointmentStatus, row.fromStatus),
            toStatus: toEnum(AppointmentStatus, row.toStatus),
            reason: row.reason,
            occurredAt: row.occurredAt,
        }));
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
