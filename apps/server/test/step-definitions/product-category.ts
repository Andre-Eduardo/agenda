import {randomInt} from 'crypto';
import {type DataTable, Given, Then} from '@cucumber/cucumber';
import {ProductCategory, ProductCategoryId} from '../../src/domain/product-category/entities';
import {ProductCategoryRepository} from '../../src/domain/product-category/product-category.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type ProductCategoryEntry = {
    companyId?: string;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
};

const productCategoryHeaderMap: Record<string, keyof ProductCategoryEntry> = {
    'Company ID': 'companyId',
    Name: 'name',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'a product category with name {string} in the company {string} exists',
    async function (this: Context, productCategoryName: string, companyName: string) {
        await createProductCategory(this, companyName, productCategoryName, {});
    }
);

Given(
    'the following product categories exist in the company {string}:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const categories: ProductCategoryEntry[] = multipleEntries<ProductCategoryEntry>(
            this,
            dataTable,
            productCategoryHeaderMap
        );

        for (const entry of categories) {
            await createProductCategory(this, company, entry.name ?? `Product Category ${randomInt(1000)}`, entry);
        }
    }
);

async function createProductCategory(
    context: Context,
    company: string,
    name: string,
    entry: ProductCategoryEntry
): Promise<void> {
    const productCategory = new ProductCategory({
        id: ProductCategoryId.generate(),
        companyId: context.variables.ids.company[company],
        name,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(productCategory);
    context.setVariableId('productCategory', productCategory.name, productCategory.id, company);
}

Then(
    'should exist product categories in the company {string} with the following data:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const productCategories: ProductCategoryEntry[] = multipleEntries<ProductCategoryEntry>(
            this,
            dataTable,
            productCategoryHeaderMap
        );

        const existingProductCategories = await this.prisma.productCategory.findMany({
            where: {
                OR: productCategories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingProductCategories).to.have.lengthOf(
            productCategories.length,
            'The number of product categories found does not match the expected number'
        );
    }
);

Then(
    'the following product categories in the company {string} should exist:',
    async function (this: Context, company: string, dataTable: DataTable) {
        const productCategories: ProductCategoryEntry[] = multipleEntries<ProductCategoryEntry>(
            this,
            dataTable,
            productCategoryHeaderMap
        );

        const existingProductCategoriesCount = await this.prisma.productCategory.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundProductCategories = await this.prisma.productCategory.findMany({
            where: {
                OR: productCategories.map((entry) => ({
                    company: {
                        name: company,
                    },
                    name: entry.name,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(foundProductCategories).to.have.lengthOf(
            productCategories.length,
            'The number of found product categories does not match the expected number'
        );

        chai.expect(foundProductCategories).to.have.lengthOf(
            existingProductCategoriesCount,
            'The number of found product categories does not match the number of existing product categories'
        );
    }
);

Then(
    'no product category with name {string} should exist in the company {string}',
    async function (this: Context, name: string, company: string) {
        const productCategories = await this.prisma.productCategory.findMany({
            where: {
                company: {
                    name: company,
                },
                name,
            },
        });

        chai.expect(productCategories).to.be.an('array').of.length(0, 'Product category found');
    }
);

function repository(context: Context) {
    return context.app.get(ProductCategoryRepository);
}
