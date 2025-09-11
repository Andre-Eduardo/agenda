import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {PaymentMethod, PaymentMethodId, PaymentMethodType} from '../../src/domain/payment-method/entities';
import {PaymentMethodRepository} from '../../src/domain/payment-method/payment-method.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type PaymentMethodEntry = {
    name?: string;
    type?: PaymentMethodType;
    companyId?: string;
    createdAt?: string;
    updatedAt?: string;
};

const paymentMethodHeaderMap: Record<string, keyof PaymentMethodEntry> = {
    Name: 'name',
    Type: 'type',
    'Company ID': 'companyId',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following payment methods exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const paymentMethods = multipleEntries<PaymentMethodEntry>(this, table, paymentMethodHeaderMap);

        for (const entry of paymentMethods) {
            await createPaymentMethod(this, companyName, entry.name ?? `randomPaymentMethod-${randomInt(1000)}`, entry);
        }
    }
);

async function createPaymentMethod(
    context: Context,
    company: string,
    name: string,
    entry: PaymentMethodEntry
): Promise<void> {
    const paymentMethod = new PaymentMethod({
        id: PaymentMethodId.generate(),
        name,
        type: entry.type ?? PaymentMethodType.CASH,
        companyId: context.variables.ids.company[company],
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(paymentMethod);

    context.setVariableId('paymentMethod', paymentMethod.name, paymentMethod.id, company);
}

Then(
    'should exist payment methods in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const paymentMethods = multipleEntries<PaymentMethodEntry>(this, table, paymentMethodHeaderMap);

        const existingPaymentMethods = await this.prisma.paymentMethod.findMany({
            where: {
                OR: paymentMethods.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    type: entry.type,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingPaymentMethods).to.have.lengthOf(
            paymentMethods.length,
            'The number of payment methods found does not match the expected number'
        );
    }
);

Then(
    'the following payment methods in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const paymentMethods = multipleEntries<PaymentMethodEntry>(this, table, paymentMethodHeaderMap);

        const existingPaymentMethodsCount = await this.prisma.paymentMethod.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundPaymentMethods = await this.prisma.paymentMethod.findMany({
            where: {
                OR: paymentMethods.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    type: entry.type,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundPaymentMethods).to.have.lengthOf(
            paymentMethods.length,
            'The number of found payment methods does not match the expected number'
        );

        chai.expect(foundPaymentMethods).to.have.lengthOf(
            existingPaymentMethodsCount,
            'The number of found payment methods does not match the number of existing payment methods'
        );
    }
);

Then(
    'no payment method with name {string} should exist in the company {string}',
    async function (this: Context, name: string, company: string) {
        const paymentMethods = await this.prisma.paymentMethod.findMany({
            where: {
                company: {
                    name: company,
                },
                name,
            },
        });

        chai.expect(paymentMethods).to.be.an('array').of.length(0, 'Payment method found');
    }
);

function repository(context: Context) {
    return context.app.get(PaymentMethodRepository);
}
