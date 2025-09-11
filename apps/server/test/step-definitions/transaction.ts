import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {PaymentMethodId} from '../../src/domain/payment-method/entities';
import {PersonId} from '../../src/domain/person/entities';
import {ReservationId} from '../../src/domain/reservation/entities';
import type {TransactionOriginType} from '../../src/domain/transaction/entities';
import {Transaction, TransactionId, TransactionType} from '../../src/domain/transaction/entities';
import {TransactionRepository} from '../../src/domain/transaction/transaction.repository';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type TransactionEntry = {
    id?: string;
    companyId?: string;
    counterpartyId?: string;
    responsibleId?: string;
    amount?: number;
    paymentMethodId?: string;
    description?: string;
    type?: TransactionType;
    originId?: string;
    originType?: TransactionOriginType;
    createdAt?: string;
    updatedAt?: string;
};

const transactionHeaderMap: Record<string, keyof TransactionEntry> = {
    ID: 'id',
    'Company ID': 'companyId',
    'Counterparty ID': 'counterpartyId',
    'Responsible ID': 'responsibleId',
    Amount: 'amount',
    'Payment method ID': 'paymentMethodId',
    Description: 'description',
    Type: 'type',
    'Origin ID': 'originId',
    'Origin type': 'originType',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following transactions exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const transactions = multipleEntries<TransactionEntry>(this, table, transactionHeaderMap);

        for (const entry of transactions) {
            await createTransaction(this, companyName, entry);
        }
    }
);

export async function createTransaction(context: Context, company: string, entry: TransactionEntry): Promise<void> {
    const transaction = new Transaction({
        id: entry.id ? TransactionId.from(entry.id) : TransactionId.generate(),
        companyId: context.variables.ids.company[company],
        counterpartyId: entry.counterpartyId ? PersonId.from(entry.counterpartyId) : null,
        responsibleId: entry.responsibleId ? UserId.from(entry.responsibleId) : UserId.generate(),
        amount: entry.amount ?? randomInt(0, 1000),
        paymentMethodId: entry.paymentMethodId
            ? PaymentMethodId.from(entry.paymentMethodId)
            : PaymentMethodId.generate(),
        description: entry.description ?? 'card transaction',
        originId: entry.originId ? ReservationId.from(entry.originId) : null,
        originType: entry.originType ?? null,
        type: entry.type ?? TransactionType.EXPENSE,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(transaction);

    context.setVariableId('transaction', `${transaction.type}.${transaction.amount}`, transaction.id, company);
}

Then(
    'should exist transactions in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const transactions = multipleEntries<TransactionEntry>(this, table, transactionHeaderMap);

        const existingTransactions = await this.prisma.transaction.findMany({
            where: {
                OR: transactions.map((entry) => ({
                    company: {
                        name: company,
                    },
                    amount: entry.amount,
                    paymentMethodId: entry.paymentMethodId,
                    description: entry.description,
                    originId: entry.originId,
                    originType: entry.originType,
                    type: entry.type,
                    counterpartyId: entry.counterpartyId,
                    responsibleId: entry.responsibleId,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingTransactions).to.have.lengthOf(
            transactions.length,
            'The number of transaction found does not match the expected number'
        );
    }
);

function repository(context: Context) {
    return context.app.get(TransactionRepository);
}
