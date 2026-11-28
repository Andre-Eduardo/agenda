import {Injectable} from '@nestjs/common';
import type * as PrismaClient from '@prisma/client';
import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import type {AccountMovement, FinancialEntry} from '@domain/financial-entry/entities';
import {AccountStatementFilter, FinancialEntryRepository} from '@domain/financial-entry/financial-entry.repository';
import {FinancialEntryMapper} from '@infrastructure/mappers/financial-entry.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class FinancialEntryPrismaRepository extends PrismaRepository implements FinancialEntryRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: FinancialEntryMapper
    ) {
        super(prismaProvider);
    }

    async findByAppointmentPaymentId(appointmentPaymentId: AppointmentPaymentId): Promise<FinancialEntry | null> {
        const entry = await this.prisma.financialEntry.findUnique({
            where: {appointmentPaymentId: appointmentPaymentId.toString()},
            include: {movements: {orderBy: [{movedAt: 'asc'}, {createdAt: 'asc'}]}},
        });

        return entry === null ? null : this.mapper.toDomain(entry);
    }

    async save(entry: FinancialEntry): Promise<void> {
        const data = this.mapper.toPersistence(entry);
        const movements = entry.takePendingMovements().map((movement) => this.mapper.movementToPersistence(movement));

        await this.prisma.financialEntry.upsert({where: {id: data.id}, create: data, update: data});

        if (movements.length > 0) {
            await this.prisma.accountMovement.createMany({data: movements});
        }
    }

    async listMovements(
        filter: AccountStatementFilter,
        page: number,
        pageSize: number
    ): Promise<{data: AccountMovement[]; total: number}> {
        const where: PrismaClient.Prisma.AccountMovementWhereInput = {
            clinicId: filter.clinicId.toString(),
            accountId: filter.accountId.toString(),
            movedAt: {gte: filter.from ?? undefined, lte: filter.to ?? undefined},
        };

        const [rows, total] = await Promise.all([
            this.prisma.accountMovement.findMany({
                where,
                orderBy: [{movedAt: 'desc'}, {createdAt: 'desc'}],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.accountMovement.count({where}),
        ]);

        return {data: rows.map((row) => this.mapper.movementToDomain(row)), total};
    }
}
