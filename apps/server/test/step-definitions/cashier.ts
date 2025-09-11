import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {CashierRepository} from '../../src/domain/cashier/cashier.repository';
import {Cashier, CashierId} from '../../src/domain/cashier/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type CashierEntry = {
    companyId?: string;
    user?: string;
    createdAt?: string;
    updatedAt?: string;
    closedAt?: string;
};

const cashierHeaderMap: Record<string, keyof CashierEntry> = {
    'Company ID': 'companyId',
    User: 'user',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
    'Closed at': 'closedAt',
};

Given(
    'the following cashiers exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const cashiers = multipleEntries<CashierEntry>(this, table, cashierHeaderMap);

        for (const entry of cashiers) {
            if (!entry.user) {
                throw new Error('Cashier must have a user.');
            }

            await openCashier(this, companyName, entry.user, entry);
        }
    }
);

async function openCashier(context: Context, company: string, username: string, entry: CashierEntry): Promise<void> {
    const userId = context.variables.ids.user[username];

    if (userId == null) {
        throw new Error(`The user ${username} must be created before opening a cashier.`);
    }

    const cashier = new Cashier({
        id: CashierId.generate(),
        companyId: context.variables.ids.company[company],
        userId,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        closedAt: entry.closedAt ? new Date(entry.closedAt) : null,
    });

    await repository(context).save(cashier);

    context.setVariableId('cashier', username, cashier.id, company);
}

Then(
    'should exist cashiers in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const cashiers = multipleEntries<CashierEntry>(this, table, cashierHeaderMap);

        const existingCashiers = await this.prisma.cashier.findMany({
            where: {
                OR: cashiers.map((entry) => ({
                    company: {
                        name: company,
                    },
                    user: {
                        username: entry.user,
                    },
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                    closedAt: entry.closedAt,
                })),
            },
        });

        chai.expect(existingCashiers).to.have.lengthOf(
            cashiers.length,
            'The number of cashiers found does not match the expected number'
        );
    }
);

Then(
    'no opened cashier for the user {string} should exist in the company {string}',
    async function (this: Context, username: string, company: string) {
        const cashiers = await this.prisma.cashier.findMany({
            where: {
                company: {
                    name: company,
                },
                user: {
                    username,
                },
            },
        });

        chai.expect(cashiers).to.be.an('array').of.length(0, 'Cashier found');
    }
);

function repository(context: Context) {
    return context.app.get(CashierRepository);
}
