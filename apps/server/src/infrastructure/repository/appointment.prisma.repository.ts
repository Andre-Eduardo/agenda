import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {AppointmentRepository, AppointmentSearchFilter, AppointmentSortOptions} from '../../domain/appointment/appointment.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {Appointment, AppointmentId} from '../../domain/appointment/entities';
import {AppointmentMapper} from '../mappers/appointment.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

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
        const appointment = await this.prisma.appointment.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return appointment === null ? null : this.mapper.toDomain(appointment);
    }

    async delete(id: AppointmentId): Promise<void> {
        await this.prisma.appointment.delete({
            where: {
                id: id.toString(),
            },
        });
    }
    async search(
        pagination: Pagination<AppointmentSortOptions>,
        filter: AppointmentSearchFilter = {}
    ): Promise<PaginatedList<Appointment>> {
        const where: PrismaClient.Prisma.AppointmentWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            note: filter.term ? {contains: filter.term, mode: 'insensitive'} : undefined,
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
}
