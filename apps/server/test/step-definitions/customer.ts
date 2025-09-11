import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../src/domain/@shared/value-objects';
import {CustomerRepository} from '../../src/domain/customer/customer.repository';
import {Customer} from '../../src/domain/customer/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../src/domain/person/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type CustomerEntry = {
    id?: string;
    name?: string;
    companyId?: string;
    documentId?: string;
    companyName?: string | null;
    personType?: keyof typeof PersonType;
    phone?: string | null;
    gender?: keyof typeof Gender | null;
    createdAt?: string;
    updatedAt?: string;
};

const customerHeaderMap: Record<string, keyof CustomerEntry> = {
    ID: 'id',
    Name: 'name',
    'Company name': 'companyName',
    'Person type': 'personType',
    'Company ID': 'companyId',
    'Document ID': 'documentId',
    Phone: 'phone',
    Gender: 'gender',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following customers exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const customers = multipleEntries<CustomerEntry>(this, table, customerHeaderMap);

        for (const entry of customers) {
            await createCustomer(this, companyName, entry.documentId ?? randomInt(0, 1000).toString(), entry);
        }
    }
);

async function createCustomer(
    context: Context,
    company: string,
    documentId: string,
    entry: CustomerEntry
): Promise<void> {
    const customer = new Customer({
        id: entry.id === undefined ? PersonId.generate() : PersonId.from(entry.id),
        phone: entry.phone ? Phone.create(entry.phone) : null,
        companyId: context.variables.ids.company[company],
        gender: entry.gender == null ? entry.gender : Gender[entry.gender],
        companyName: entry.companyName ?? undefined,
        name: entry.name ?? `randomCustomer-${randomInt(1000)}`,
        profiles: new Set([PersonProfile.CUSTOMER]),
        personType: PersonType[entry.personType ?? PersonType.NATURAL],
        documentId: DocumentId.create(documentId),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(customer);

    context.setVariableId('customer', customer.documentId, customer.id, company);
}

Then(
    'should exist customers in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const customers = multipleEntries<CustomerEntry>(this, table, customerHeaderMap);
        const existingCustomers = await this.prisma.customer.findMany({
            where: {
                OR: customers.map((entry) => ({
                    person: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        name: entry.name,
                        companyName: entry.companyName,
                        documentId:
                            entry.documentId === undefined ? undefined : DocumentId.create(entry.documentId).toString(),
                        phone: entry.phone == null ? entry.phone : Phone.create(entry.phone).toString(),
                        gender: entry.gender,
                        personType: entry.personType,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        profiles: {
                            has: PrismaClient.PersonProfile.CUSTOMER,
                        },
                    },
                })),
            },
        });

        chai.expect(existingCustomers).to.have.lengthOf(
            customers.length,
            'The number of customer found does not match the expected number'
        );
    }
);

Then(
    'the following customers in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const customers = multipleEntries<CustomerEntry>(this, table, customerHeaderMap);

        const existingCustomersCount = await this.prisma.customer.count({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                },
            },
        });
        const foundCustomers = await this.prisma.customer.findMany({
            where: {
                OR: customers.map((entry) => ({
                    person: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        name: entry.name,
                        companyName: entry.companyName,
                        documentId:
                            entry.documentId === undefined ? undefined : DocumentId.create(entry.documentId).toString(),
                        phone: entry.phone == null ? entry.phone : Phone.create(entry.phone).toString(),
                        gender: entry.gender,
                        personType: entry.personType,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        profiles: {
                            has: PrismaClient.PersonProfile.CUSTOMER,
                        },
                    },
                })),
            },
        });

        chai.expect(foundCustomers).to.have.lengthOf(
            customers.length,
            'The number of found customers does not match the expected number'
        );

        chai.expect(foundCustomers).to.have.lengthOf(
            existingCustomersCount,
            'The number of found customers does not match the number of existing customers'
        );
    }
);

Then(
    'no customer with document ID {string} should exist in the company {string}',
    async function (this: Context, documentId: string, company: string) {
        const customers = await this.prisma.customer.findMany({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                    documentId: DocumentId.create(documentId).toString(),
                },
            },
        });

        chai.expect(customers).to.be.an('array').of.length(0, 'Customers found');
    }
);

function repository(context: Context) {
    return context.app.get(CustomerRepository);
}
