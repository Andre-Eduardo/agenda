import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Then, Given} from '@cucumber/cucumber';
import {Product, ProductId} from '../../src/domain/product/entities';
import {ProductRepository} from '../../src/domain/product/product.repository';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type ProductEntry = {
    companyId?: string;
    categoryId?: string;
    code?: number;
    name?: string;
    price?: number;
    createdAt?: string;
    updatedAt?: string;
};

const productHeaderMap: Record<string, keyof ProductEntry> = {
    'Company ID': 'companyId',
    'Category ID': 'categoryId',
    Code: 'code',
    Name: 'name',
    Price: 'price',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following products exist in the company {string} and product category {string}:',
    async function (this: Context, companyName: string, productCategoryName: string, table: DataTable) {
        const products = multipleEntries<ProductEntry>(this, table, productHeaderMap);

        for (const entry of products) {
            await createProduct(this, companyName, productCategoryName, entry.code ?? randomInt(1, 1000), entry);
        }
    }
);

async function createProduct(
    context: Context,
    company: string,
    productCategory: string,
    code: number,
    entry: ProductEntry
): Promise<void> {
    const product = new Product({
        id: ProductId.generate(),
        companyId: context.variables.ids.company[company],
        categoryId: context.variables.ids.companyScope.productCategory[company][productCategory],
        code,
        name: entry.name ?? `randomProductName-${randomInt(1000)}`,
        price: entry.price ?? 0,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(product);

    context.setVariableId('product', product.code, product.id, company);
}

Then(
    'should exist products in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const products = multipleEntries<ProductEntry>(this, table, productHeaderMap);

        const existingProducts = await this.prisma.product.findMany({
            where: {
                OR: products.map((entry) => ({
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

        chai.expect(existingProducts).to.have.lengthOf(
            products.length,
            'The number of products found does not match the expected number'
        );
    }
);

Then(
    'the following products in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const products = multipleEntries<ProductEntry>(this, table, productHeaderMap);

        const existingProductsCount = await this.prisma.product.count({
            where: {
                company: {
                    name: company,
                },
            },
        });
        const foundProducts = await this.prisma.product.findMany({
            where: {
                OR: products.map((entry) => ({
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

        chai.expect(foundProducts).to.have.lengthOf(
            products.length,
            'The number of found products does not match the expected number'
        );

        chai.expect(foundProducts).to.have.lengthOf(
            existingProductsCount,
            'The number of found products does not match the number of existing products'
        );
    }
);

function repository(context: Context) {
    return context.app.get(ProductRepository);
}
