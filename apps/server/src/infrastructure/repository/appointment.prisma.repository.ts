import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {
    AppointmentRepository,
    AppointmentSearchFilter,
    AppointmentSortOptions,
} from '../../domain/appointment/appointment.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {Appointment, AppointmentId} from '../../domain/appointment/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {AppointmentMapper} from '../mappers/appointment.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentPrismaRepository extends PrismaRepository implements AppointmentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: AppointmentId): Promise<Appointment | null> {
        const appointment = await this.prisma.appointment.findUnique({
            where: {id: id.toString()},
        });
        return appointment === null ? null : this.mapper.toDomain(appointment);
    }

    async delete(id: AppointmentId): Promise<void> {
        await this.prisma.appointment.delete({where: {id: id.toString()}});
    }

    async search(
        pagination: Pagination<AppointmentSortOptions>,
        filter: AppointmentSearchFilter = {},
    ): Promise<PaginatedList<Appointment>> {
        const where: PrismaClient.Prisma.AppointmentWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
            attendedByMemberId: filter.attendedByMemberId ? filter.attendedByMemberId.toString() : undefined,
            createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
            patientId: filter.patientId ? filter.patientId.toString() : undefined,
            status: filter.status ? {in: filter.status} : undefined,
            startAt:
                filter.dateFrom || filter.dateTo
                    ? {gte: filter.dateFrom, lte: filter.dateTo}
                    : undefined,
            note: filter.term ? {contains: filter.term, mode: 'insensitive'} : undefined,
            deletedAt: null,
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
        excludeId?: AppointmentId,
    ): Promise<Appointment[]> {
        const records = await this.prisma.appointment.findMany({
            where: {
                attendedByMemberId: attendedByMemberId.toString(),
                id: excludeId ? {not: excludeId.toString()} : undefined,
                status: {in: ['SCHEDULED', 'CONFIRMED']},
                startAt: {lt: endAt},
                endAt: {gt: startAt},
                deletedAt: null,
            },
        });

        return records.map((r) => this.mapper.toDomain(r));
    }
}
