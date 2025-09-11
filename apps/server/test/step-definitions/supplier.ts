import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../src/domain/@shared/value-objects';
import {Gender, PersonId, PersonProfile, PersonType} from '../../src/domain/person/entities';
import {Supplier} from '../../src/domain/supplier/entities';
import {SupplierRepository} from '../../src/domain/supplier/supplier.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type SupplierEntry = {
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

const supplierHeaderMap: Record<string, keyof SupplierEntry> = {
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
    'the following suppliers exist in the company {string}:',
    async function (this: Context, companyName: string, table: DataTable) {
        const suppliers = multipleEntries<SupplierEntry>(this, table, supplierHeaderMap);

        for (const entry of suppliers) {
            await createSupplier(this, companyName, entry.documentId ?? randomInt(0, 1000).toString(), entry);
        }
    }
);

async function createSupplier(
    context: Context,
    company: string,
    documentId: string,
    entry: SupplierEntry
): Promise<void> {
    const supplier = new Supplier({
        id: entry.id === undefined ? PersonId.generate() : PersonId.from(entry.id),
        phone: entry.phone ? Phone.create(entry.phone) : null,
        companyId: context.variables.ids.company[company],
        gender: entry.gender == null ? entry.gender : Gender[entry.gender],
        companyName: entry.companyName ?? undefined,
        name: entry.name ?? `randomSupplier-${randomInt(1000)}`,
        profiles: new Set([PersonProfile.SUPPLIER]),
        personType: PersonType[entry.personType ?? PersonType.LEGAL],
        documentId: DocumentId.create(documentId),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(supplier);

    context.setVariableId('supplier', supplier.documentId, supplier.id, company);
}

Then(
    'should exist suppliers in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const suppliers = multipleEntries<SupplierEntry>(this, table, supplierHeaderMap);
        const existingSuppliers = await this.prisma.supplier.findMany({
            where: {
                OR: suppliers.map((entry) => ({
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
                            has: PrismaClient.PersonProfile.SUPPLIER,
                        },
                    },
                })),
            },
        });

        chai.expect(existingSuppliers).to.have.lengthOf(
            suppliers.length,
            'The number of supplier found does not match the expected number'
        );
    }
);

Then(
    'the following suppliers in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const suppliers = multipleEntries<SupplierEntry>(this, table, supplierHeaderMap);

        const existingSuppliersCount = await this.prisma.supplier.count({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                },
            },
        });
        const foundSuppliers = await this.prisma.supplier.findMany({
            where: {
                OR: suppliers.map((entry) => ({
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
                            has: PrismaClient.PersonProfile.SUPPLIER,
                        },
                    },
                })),
            },
        });

        chai.expect(foundSuppliers).to.have.lengthOf(
            suppliers.length,
            'The number of found suppliers does not match the expected number'
        );

        chai.expect(foundSuppliers).to.have.lengthOf(
            existingSuppliersCount,
            'The number of found suppliers does not match the number of existing suppliers'
        );
    }
);

Then(
    'no supplier with document ID {string} should exist in the company {string}',
    async function (this: Context, documentId: string, company: string) {
        const suppliers = await this.prisma.supplier.findMany({
            where: {
                person: {
                    company: {
                        name: company,
                    },
                    documentId: DocumentId.create(documentId).toString(),
                },
            },
        });

        chai.expect(suppliers).to.be.an('array').of.length(0, 'Supplier found');
    }
);

function repository(context: Context) {
    return context.app.get(SupplierRepository);
}
