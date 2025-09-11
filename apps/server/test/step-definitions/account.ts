import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {AccountRepository} from '../../src/domain/account/account.repository';
import {Account, AccountId, AccountType} from '../../src/domain/account/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type AccountEntry = {
    companyId?: string;
    name?: string;
    type?: keyof typeof AccountType;
    bankId?: number;
    agencyNumber?: number;
    agencyDigit?: string;
    accountDigit?: string;
    accountNumber?: number;
    createdAt?: string;
    updatedAt?: string;
};

const accountHeaderMap: Record<string, keyof AccountEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    Type: 'type',
    'Bank ID': 'bankId',
    'Agency Number': 'agencyNumber',
    'Agency Digit': 'agencyDigit',
    'Account Digit': 'accountDigit',
    'Account Number': 'accountNumber',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following accounts exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const accounts = multipleEntries<AccountEntry>(this, table, accountHeaderMap);

        for (const entry of accounts) {
            await createAccount(this, companyName, entry);
        }
    }
);

async function createAccount(context: Context, company: string, entry: AccountEntry): Promise<void> {
    const account = new Account({
        id: AccountId.generate(),
        companyId: context.variables.ids.company[company],
        name: entry.name ?? `randomAccountName-${randomInt(1000)}`,
        type: entry.type ? AccountType[entry.type] : AccountType.INTERNAL,
        bankId: entry.bankId ?? null,
        agencyNumber: entry.agencyNumber ?? null,
        agencyDigit: entry.agencyDigit ?? null,
        accountDigit: entry.accountDigit ?? null,
        accountNumber: entry.accountNumber ?? null,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(account);

    context.setVariableId('account', account.name, account.id, company);
}

Then(
    'should exist accounts in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const accounts = multipleEntries<AccountEntry>(this, table, accountHeaderMap);

        const existingAccounts = await this.prisma.account.findMany({
            where: {
                OR: accounts.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    type: entry.type,
                    bankId: entry.bankId,
                    agencyNumber: entry.agencyNumber,
                    agencyDigit: entry.agencyDigit,
                    accountDigit: entry.accountDigit,
                    accountNumber: entry.accountNumber,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingAccounts).to.have.lengthOf(
            accounts.length,
            'The number of accounts found does not match the expected number'
        );
    }
);

Then(
    'the following accounts in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const accounts = multipleEntries<AccountEntry>(this, table, accountHeaderMap);

        const existingAccountsCount = await this.prisma.account.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundAccounts = await this.prisma.account.findMany({
            where: {
                OR: accounts.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    type: entry.type,
                    bankId: entry.bankId,
                    agencyNumber: entry.agencyNumber,
                    agencyDigit: entry.agencyDigit,
                    accountDigit: entry.accountDigit,
                    accountNumber: entry.accountNumber,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundAccounts).to.have.lengthOf(
            accounts.length,
            'The number of found accounts does not match the expected number'
        );

        chai.expect(foundAccounts).to.have.lengthOf(
            existingAccountsCount,
            'The number of found accounts does not match the number of existing accounts'
        );
    }
);

function repository(context: Context) {
    return context.app.get(AccountRepository);
}
