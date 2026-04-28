import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {
    AppointmentPaymentRepository,
    AppointmentPaymentSearchFilter,
} from '../../domain/appointment-payment/appointment-payment.repository';
import {AppointmentPayment, AppointmentPaymentId} from '../../domain/appointment-payment/entities';
import {AppointmentId} from '../../domain/appointment/entities';
import {AppointmentPaymentMapper} from '../mappers/appointment-payment.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class AppointmentPaymentPrismaRepository extends PrismaRepository implements AppointmentPaymentRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentPaymentMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: AppointmentPaymentId): Promise<AppointmentPayment | null> {
        const record = await this.prisma.appointmentPayment.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async findByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentPayment | null> {
        const record = await this.prisma.appointmentPayment.findUnique({
            where: {appointmentId: appointmentId.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async save(payment: AppointmentPayment): Promise<void> {
        const data = this.mapper.toPersistence(payment);

        await this.prisma.appointmentPayment.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async findByAppointmentIds(appointmentIds: AppointmentId[]): Promise<AppointmentPayment[]> {
        if (appointmentIds.length === 0) return [];
        const records = await this.prisma.appointmentPayment.findMany({
            where: {appointmentId: {in: appointmentIds.map((id) => id.toString())}},
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async search(
        filter: AppointmentPaymentSearchFilter,
        page: number,
        pageSize: number,
    ): Promise<{data: AppointmentPayment[]; total: number}> {
        const where: PrismaClient.Prisma.AppointmentPaymentWhereInput = {
            clinicId: filter.clinicId.toString(),
            paidAt: {
                gte: filter.startDate,
                lte: filter.endDate,
            },
            paymentMethod: filter.paymentMethod,
            status: filter.status,
            ...(filter.attendedByMemberId
                ? {appointment: {attendedByMemberId: filter.attendedByMemberId}}
                : {}),
        };

        const skip = (page - 1) * pageSize;

        const [data, total] = await Promise.all([
            this.prisma.appointmentPayment.findMany({
                where,
                orderBy: {paidAt: 'desc'},
                skip,
                take: pageSize,
            }),
            this.prisma.appointmentPayment.count({where}),
        ]);

        return {
            data: data.map((r) => this.mapper.toDomain(r)),
            total,
        };
    }
}
