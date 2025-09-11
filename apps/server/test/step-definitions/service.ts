import {randomInt} from 'crypto';
import {type DataTable, Given, Then} from '@cucumber/cucumber';
import {Service, ServiceId} from '../../src/domain/service/entities';
import {ServiceRepository} from '../../src/domain/service/service.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type ServiceEntry = {
    companyId?: string;
    categoryId?: string;
    name?: string;
    code?: number;
    price?: number;
    createdAt?: Date;
    updatedAt?: Date;
};

const serviceHeaderMap: Record<string, keyof ServiceEntry> = {
    'Company ID': 'companyId',
    'Category ID': 'categoryId',
    Code: 'code',
    Name: 'name',
    Price: 'price',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

async function createService(
    context: Context,
    company: string,
    serviceCategory: string,
    code: number,
    entry: ServiceEntry
): Promise<void> {
    const service = new Service({
        id: ServiceId.generate(),
        companyId: context.variables.ids.company[company],
        categoryId: context.variables.ids.companyScope.serviceCategory[company][serviceCategory],
        name: entry.name ?? `randomServiceName-${randomInt(1000)}`,
        code,
        price: entry.price ?? randomInt(1, 1000),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(service);

    context.setVariableId('service', service.code, service.id, company);
}

Given(
    'the following services exist in the company {string} and service category {string}:',
    async function (this: Context, companyName: string, serviceCategoryName: string, table: DataTable) {
        const services = multipleEntries<ServiceEntry>(this, table, serviceHeaderMap);

        for (const entry of services) {
            await createService(this, companyName, serviceCategoryName, entry.code ?? randomInt(1, 1000), entry);
        }
    }
);

Then(
    'should exist services in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const services = multipleEntries<ServiceEntry>(this, table, serviceHeaderMap);

        const existingServices = await this.prisma.service.findMany({
            where: {
                OR: services.map((entry) => ({
                    company: {
                        name: company,
                    },
                    code: entry.code,
                    name: entry.name,
                    price: entry.price,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingServices).to.have.lengthOf(
            services.length,
            'The number of services found does not match the expected number'
        );
    }
);

Then(
    'the following services in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const services = multipleEntries<ServiceEntry>(this, table, serviceHeaderMap);

        const existingServicesCount = await this.prisma.service.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundServices = await this.prisma.service.findMany({
            where: {
                OR: services.map((entry) => ({
                    company: {
                        name: company,
                    },
                    code: entry.code,
                    name: entry.name,
                    price: entry.price,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundServices).to.have.lengthOf(
            services.length,
            'The number of found services does not match the expected number'
        );

        chai.expect(foundServices).to.have.lengthOf(
            existingServicesCount,
            'The number of found services does not match the number of existing services'
        );
    }
);

function repository(context: Context) {
    return context.app.get(ServiceRepository);
}
