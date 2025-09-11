import {CompanyId} from '../../../company/entities';
import {ProductId} from '../../../product/entities';
import {UserId} from '../../../user/entities';
import {SaleItem} from '../sale-item.entity';
import {Sale, SaleId} from '../sale.entity';
import {fakeSale} from './fake-sale';
import {fakeSaleItem} from './fake-sale-item';

describe('A sale', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should generate a new entity', () => {
            const sellerId = UserId.generate();
            const productId = ProductId.generate();

            const sale = Sale.create({
                companyId: CompanyId.generate(),
                sellerId,
                items: [
                    {
                        productId,
                        price: 10.2,
                        quantity: 1,
                    },
                ],
                note: 'note',
            });

            expect(sale.id).toBeInstanceOf(SaleId);
            expect(sale.sellerId).toBe(sellerId);
            expect(sale.items).toEqual([
                new SaleItem({
                    id: sale.items[0].id,
                    saleId: sale.id,
                    productId,
                    price: 10.2,
                    quantity: 1,
                    note: null,
                    canceledAt: null,
                    canceledBy: null,
                    canceledReason: null,
                    createdAt: now,
                    updatedAt: now,
                }),
            ]);
            expect(sale.createdAt).toStrictEqual(now);
            expect(sale.updatedAt).toStrictEqual(now);

            expect(sale).toBeInstanceOf(Sale);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() => new Sale({...fakeSale(), items: []})).toThrow(
                'At least one product must be added to the sale.'
            );
        });
    });

    it('should calculate the total value', () => {
        const sale = fakeSale({
            items: [fakeSaleItem({price: 10.2, quantity: 1}), fakeSaleItem({price: 5.2, quantity: 2})],
        });

        expect(sale.getTotalValue()).toBe(20.6);
    });

    it.each(['note', null])('should be serializable', (note) => {
        const saleId = SaleId.generate();

        const sale = fakeSale({
            id: saleId,
            note,
        });

        expect(sale.toJSON()).toEqual({
            id: saleId.toJSON(),
            companyId: sale.companyId.toJSON(),
            sellerId: sale.sellerId.toJSON(),
            items: sale.items.map((item) => item.toJSON()),
            note,
            createdAt: sale.createdAt.toJSON(),
            updatedAt: sale.updatedAt.toJSON(),
        });
    });
});

describe('A sale ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = SaleId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(SaleId.generate()).toBeInstanceOf(SaleId);
    });
});
