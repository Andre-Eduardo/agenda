import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import {PersonId} from '../../src/domain/person/entities';
import {ProductId} from '../../src/domain/product/entities';
import {DirectSaleRepository} from '../../src/domain/sale/direct-sale.repository';
import {DirectSale, SaleId, SaleItem, SaleItemId} from '../../src/domain/sale/entities';
import {UserId} from '../../src/domain/user/entities';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type SaleItemEntry = {
    id?: string;
    saleId?: string;
    productId?: string;
    quantity?: number;
    price?: number;
    note?: string | null;
    canceledAt: string | null;
    canceledBy: string | null;
    canceledReason: string | null;
};

type DirectSaleEntry = {
    id?: string;
    companyId?: string;
    sellerName?: string;
    buyerId?: string | null;
    items?: SaleItemEntry[];
    note?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

const directSaleHeaderMap: Record<string, keyof DirectSaleEntry> = {
    ID: 'id',
    'Company ID': 'companyId',
    'Seller name': 'sellerName',
    'Buyer ID': 'buyerId',
    Items: 'items',
    Note: 'note',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

Given(
    'the following direct sales exist in the company {string}:',
    async function (this: Context, company: string, table: DataTable) {
        const directSales = multipleEntries<DirectSaleEntry>(this, table, directSaleHeaderMap);

        for (const entry of directSales) {
            await createDirectSale(this, company, entry.sellerName ?? randomInt(0, 1000).toString(), entry);
        }
    }
);

async function createDirectSale(
    context: Context,
    company: string,
    sellerName: string,
    entry: DirectSaleEntry
): Promise<void> {
    const sellerId = context.variables.ids.user[sellerName];
    const saleId = SaleId.generate();

    const directSale = new DirectSale({
        id: saleId,
        companyId: context.variables.ids.company[company],
        sellerId,
        buyerId: entry.buyerId == null ? null : PersonId.from(entry.buyerId),
        note: entry.note ?? null,
        items: entry.items
            ? entry.items.map(
                  (saleItem) =>
                      new SaleItem({
                          id: saleItem.id ? SaleItemId.from(saleItem.id) : SaleItemId.generate(),
                          saleId,
                          productId: saleItem.productId ? ProductId.from(saleItem.productId) : ProductId.generate(),
                          quantity: saleItem.quantity ?? 1,
                          price: saleItem.price ?? 10.2,
                          note: saleItem.note ?? null,
                          canceledAt: saleItem.canceledAt ? new Date(saleItem.canceledAt) : null,
                          canceledBy: saleItem.canceledBy ? UserId.from(saleItem.canceledBy) : null,
                          canceledReason: saleItem.canceledReason ?? null,
                          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
                          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
                      })
              )
            : [
                  SaleItem.create({
                      saleId,
                      productId: ProductId.generate(),
                      price: 10.2,
                      quantity: 1,
                  }),
              ],
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    await repository(context).save(directSale);

    context.setVariableId('directSale', sellerName, directSale.id, company);
}

Then(
    'should exist direct sales in the company {string} with the following data:',
    async function (this: Context, company: string, table: DataTable) {
        const directSales = multipleEntries<DirectSaleEntry>(this, table, directSaleHeaderMap);

        const existingDirectSales = await this.prisma.directSale.findMany({
            where: {
                OR: directSales.map((entry) => ({
                    sale: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        seller: {
                            username: entry.sellerName,
                        },
                        items: {
                            every: {
                                OR: entry.items?.map((item) => ({
                                    saleId: entry.id,
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    note: item.note,
                                    canceledAt: item.canceledAt,
                                    canceledById: item.canceledBy,
                                    canceledReason: item.canceledReason,
                                })),
                            },
                        },
                        note: entry.note,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    },
                    buyerId: entry.buyerId,
                })),
            },
        });

        chai.expect(existingDirectSales).to.have.lengthOf(
            directSales.length,
            'The number of direct sales found does not match the expected number'
        );
    }
);

Then(
    'the following direct sales in the company {string} should exist:',
    async function (this: Context, company: string, table: DataTable) {
        const directSales = multipleEntries<DirectSaleEntry>(this, table, directSaleHeaderMap);

        const existingDirectSalesCount = await this.prisma.directSale.count({
            where: {
                sale: {
                    company: {
                        name: company,
                    },
                },
            },
        });
        const foundDirectSales = await this.prisma.directSale.findMany({
            where: {
                OR: directSales.map((entry) => ({
                    sale: {
                        id: entry.id,
                        companyId: this.getVariableId('company', company).toString(),
                        seller: {
                            username: entry.sellerName,
                        },
                        items: {
                            every: {
                                OR: entry.items?.map((product) => ({
                                    saleId: entry.id,
                                    productId: product.productId,
                                    quantity: product.quantity,
                                    price: product.price,
                                    note: product.note,
                                    canceledAt: product.canceledAt,
                                    canceledById: product.canceledBy,
                                    canceledReason: product.canceledReason,
                                })),
                            },
                        },
                        note: entry.note,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    },
                    buyerId: entry.buyerId,
                })),
            },
            include: {
                sale: {
                    include: {
                        items: true,
                    },
                },
            },
        });

        chai.expect(foundDirectSales).to.have.lengthOf(
            directSales.length,
            'The number of found direct sales does not match the expected number'
        );

        chai.expect(foundDirectSales).to.have.lengthOf(
            existingDirectSalesCount,
            'The number of found direct sales does not match the number of existing direct sales'
        );
    }
);

function repository(context: Context) {
    return context.app.get(DirectSaleRepository);
}
