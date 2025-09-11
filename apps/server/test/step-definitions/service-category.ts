import {randomInt} from 'crypto';
import {type DataTable, Given, Then} from '@cucumber/cucumber';
import {ServiceCategory, ServiceCategoryId} from '../../src/domain/service-category/entities';
import {ServiceCategoryRepository} from '../../src/domain/service-category/service-category.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type ServiceCategoryEntry = {
    companyId?: string;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
};

const serviceCategoryHeaderMap: Record<string, keyof ServiceCategoryEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'a service category with name {string} in the company {string} exists',
    async function (this: Context, serviceCategoryName: string, companyName: string) {
        await createServiceCategory(this, companyName, serviceCategoryName, {});
    }
);

Given(
    'the following service categories exist in the company {string}:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const categories: ServiceCategoryEntry[] = multipleEntries<ServiceCategoryEntry>(
            this,
            dataTable,
            serviceCategoryHeaderMap
        );

        for (const entry of categories) {
            await createServiceCategory(this, company, entry.name ?? `Service Category ${randomInt(1000)}`, entry);
        }
    }
);

async function createServiceCategory(
    context: Context,
    company: string,
    name: string,
    entry: ServiceCategoryEntry
): Promise<void> {
    const serviceCategory = new ServiceCategory({
        id: ServiceCategoryId.generate(),
        companyId: context.variables.ids.company[company],
        name,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(serviceCategory);
    context.setVariableId('serviceCategory', serviceCategory.name, serviceCategory.id, company);
}

Then(
    'should exist service categories in the company {string} with the following data:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const serviceCategories: ServiceCategoryEntry[] = multipleEntries<ServiceCategoryEntry>(
            this,
            dataTable,
            serviceCategoryHeaderMap
        );

        const existingServiceCategories = await this.prisma.serviceCategory.findMany({
            where: {
                OR: serviceCategories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingServiceCategories).to.have.lengthOf(
            serviceCategories.length,
            'The number of service categories found does not match the expected number'
        );
    }
);

Then(
    'the following service categories in the company {string} should exist:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const serviceCategories: ServiceCategoryEntry[] = multipleEntries<ServiceCategoryEntry>(
            this,
            dataTable,
            serviceCategoryHeaderMap
        );

        const existingServiceCategoriesCount = await this.prisma.serviceCategory.count({
            where: {
                company: {
                    name: company,
                },
            },
        });

        const foundServiceCategories = await this.prisma.serviceCategory.findMany({
            where: {
                OR: serviceCategories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundServiceCategories).to.have.lengthOf(
            serviceCategories.length,
            'The number of found service categories does not match the expected number'
        );

        chai.expect(foundServiceCategories).to.have.lengthOf(
            existingServiceCategoriesCount,
            'The number of found service categories does not match the number of existing service categories'
        );
    }
);

Then(
    'no service category with name {string} should exist in the company {string}',
    async function (this: Context, name: string, company: string) {
        const serviceCategories = await this.prisma.serviceCategory.findMany({
            where: {
                company: {
                    name: company,
                },
                name,
            },
        });

        chai.expect(serviceCategories).to.be.an('array').of.length(0, 'Service category found');
    }
);

function repository(context: Context) {
    return context.app.get(ServiceCategoryRepository);
}
