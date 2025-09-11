import {Injectable} from '@nestjs/common';
import * as PrismaTransaction from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {PaymentMethodId} from '../../domain/payment-method/entities';
import {PersonId} from '../../domain/person/entities';
import {ReservationId} from '../../domain/reservation/entities';
import {SaleId} from '../../domain/sale/entities';
import {Transaction, TransactionId, TransactionOriginType, TransactionType} from '../../domain/transaction/entities';
import {
    TransactionRepository,
    TransactionSearchFilter,
    TransactionSortOptions,
} from '../../domain/transaction/transaction.repository';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type TransactionModel = PrismaTransaction.Transaction;

@Injectable()
export class TransactionPrismaRepository extends PrismaRepository implements TransactionRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(transaction: TransactionModel): Transaction {
        const originEntityId = {
            [TransactionOriginType.RESERVATION]: ReservationId,
            [TransactionOriginType.DIRECT_SALE]: SaleId,
        };

        return new Transaction({
            ...transaction,
            id: TransactionId.from(transaction.id),
            companyId: CompanyId.from(transaction.companyId),
            paymentMethodId: PaymentMethodId.from(transaction.paymentMethodId),
            counterpartyId: transaction.counterpartyId ? PersonId.from(transaction.counterpartyId) : null,
            responsibleId: UserId.from(transaction.responsibleId),
            type: TransactionType[transaction.type],
            originId:
                transaction.originId && transaction.originType
                    ? originEntityId[transaction.originType].from(transaction.originId)
                    : null,
            originType: transaction.originType ? TransactionOriginType[transaction.originType] : null,
        });
    }

    private static denormalize(transaction: Transaction): TransactionModel {
        return {
            id: transaction.id.toString(),
            companyId: transaction.companyId.toString(),
            amount: transaction.amount,
            paymentMethodId: transaction.paymentMethodId.toString(),
            counterpartyId: transaction.counterpartyId?.toString() ?? null,
            responsibleId: transaction.responsibleId.toString(),
            description: transaction.description,
            originId: transaction.originId?.toString() ?? null,
            originType: transaction.originType,
            type: transaction.type,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }

    async findById(id: TransactionId): Promise<Transaction | null> {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return transaction === null ? null : TransactionPrismaRepository.normalize(transaction);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<TransactionSortOptions>,
        filter: TransactionSearchFilter = {}
    ): Promise<PaginatedList<Transaction>> {
        const where: PrismaTransaction.Prisma.TransactionWhereInput = {
            id: {in: filter.ids?.map((id) => id.toString())},
            companyId: companyId.toString(),
            description: {
                mode: 'insensitive',
                contains: filter.description,
            },
            amount: filter.amount === undefined ? undefined : {gte: filter.amount.from, lte: filter.amount.to},
            paymentMethodId: filter.paymentMethodId?.toString(),
            counterpartyId: filter.counterpartyId == null ? filter.counterpartyId : filter.counterpartyId.toString(),
            responsibleId: filter.responsibleId?.toString(),
            type: filter.type,
            originId: filter.originId == null ? filter.originId : filter.originId?.toString(),
            originType: filter.originType,
        };

        const [transactions, totalCount] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.transaction.count({where}),
        ]);

        return {
            data: transactions
                .slice(0, pagination.limit)
                .map((transaction) => TransactionPrismaRepository.normalize(transaction)),
            totalCount,
            nextCursor: transactions.length > pagination.limit ? transactions[transactions.length - 1].id : null,
        };
    }

    async save(transaction: Transaction): Promise<void> {
        const transactionModel = TransactionPrismaRepository.denormalize(transaction);

        await this.prisma.transaction.upsert({
            where: {
                id: transactionModel.id,
            },
            create: transactionModel,
            update: transactionModel,
        });
    }
}
