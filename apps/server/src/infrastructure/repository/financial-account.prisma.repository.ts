import {Injectable} from '@nestjs/common';
import type {ClinicId} from '@domain/clinic/entities';
import {FinancialAccount, FinancialAccountId, FinancialAccountType} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialAccountMapper} from '@infrastructure/mappers/financial-account.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class FinancialAccountPrismaRepository extends PrismaRepository implements FinancialAccountRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: FinancialAccountMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: FinancialAccountId): Promise<FinancialAccount | null> {
        const account = await this.prisma.financialAccount.findFirst({where: {id: id.toString(), deletedAt: null}});

        return account === null ? null : this.mapper.toDomain(account);
    }

    async findByClinicId(clinicId: ClinicId): Promise<FinancialAccount[]> {
        const accounts = await this.prisma.financialAccount.findMany({
            where: {clinicId: clinicId.toString(), deletedAt: null},
            orderBy: [{type: 'asc'}, {isDefault: 'desc'}, {name: 'asc'}],
        });

        return accounts.map((account) => this.mapper.toDomain(account));
    }

    async findDefault(clinicId: ClinicId, type: FinancialAccountType): Promise<FinancialAccount | null> {
        const account = await this.prisma.financialAccount.findFirst({
            where: {clinicId: clinicId.toString(), type, isDefault: true, deletedAt: null},
        });

        return account === null ? null : this.mapper.toDomain(account);
    }

    async balances(clinicId: ClinicId): Promise<Map<string, number>> {
        const groups = await this.prisma.accountMovement.groupBy({
            by: ['accountId', 'direction'],
            where: {clinicId: clinicId.toString()},
            _sum: {amountCents: true},
        });

        const balances = new Map<string, number>();

        for (const group of groups) {
            const amount = group._sum.amountCents ?? 0;
            const signed = group.direction === 'IN' ? amount : -amount;

            balances.set(group.accountId, (balances.get(group.accountId) ?? 0) + signed);
        }

        return balances;
    }

    async save(account: FinancialAccount): Promise<void> {
        const data = this.mapper.toPersistence(account);

        await this.prisma.financialAccount.upsert({where: {id: data.id}, create: data, update: data});
    }
}
