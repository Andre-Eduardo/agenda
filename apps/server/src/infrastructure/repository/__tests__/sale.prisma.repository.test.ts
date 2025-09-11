import {mockDeep} from 'jest-mock-extended';
import type {Sale} from '../../../domain/sale/entities';
import {SaleId} from '../../../domain/sale/entities';
import {fakeSale} from '../../../domain/sale/entities/__tests__/fake-sale';
import {fakeSaleItem} from '../../../domain/sale/entities/__tests__/fake-sale-item';
import type {PrismaService} from '../prisma';
import type {SaleModel} from '../sale.prisma.repository';
import {SalePrismaRepository} from '../sale.prisma.repository';

describe('A sale repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new SalePrismaRepository(prisma);

    const saleId = SaleId.generate();
    const include = {
        items: true,
    };

    const domainSales: Sale[] = [
        fakeSale({
            id: saleId,
            items: [
                fakeSaleItem({
                    saleId,
                    quantity: 1,
                    price: 10.2,
                    note: 'note',
                }),
            ],
            note: 'note',
        }),
        fakeSale({
            id: saleId,
            items: [
                fakeSaleItem({
                    saleId,
                    quantity: 3,
                    price: 1.2,
                    note: 'test',
                }),
            ],
            note: null,
        }),
    ];

    const databaseSales: SaleModel[] = domainSales.map((domainSale) => ({
        id: domainSale.id.toString(),
        companyId: domainSale.companyId.toString(),
        sellerId: domainSale.sellerId.toString(),
        items: domainSale.items.map((prod) => ({
            id: prod.id.toString(),
            saleId: prod.saleId.toString(),
            productId: prod.productId.toString(),
            price: prod.price,
            quantity: prod.quantity,
            note: prod.note,
            canceledAt: prod.canceledAt,
            canceledById: prod.canceledBy?.toString() ?? null,
            canceledReason: prod.canceledReason,
            createdAt: prod.createdAt,
            updatedAt: prod.updatedAt,
        })),
        note: domainSale.note,
        createdAt: domainSale.createdAt,
        updatedAt: domainSale.updatedAt,
    }));

    it.each([
        [null, null],
        [databaseSales[0], domainSales[0]],
    ])('should find a sale by ID', async (databaseSale, domainSale) => {
        jest.spyOn(prisma.sale, 'findUnique').mockResolvedValueOnce(databaseSale);

        await expect(repository.findById(domainSales[0].id)).resolves.toEqual(domainSale);

        expect(prisma.sale.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.sale.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainSales[0].id.toString(),
            },
            include,
        });
    });
});
