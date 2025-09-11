import {InvalidInputException} from '../../../@shared/exceptions';
import {ProductId} from '../../../product/entities';
import {SaleItem, SaleItemId} from '../sale-item.entity';
import {SaleId} from '../sale.entity';
import {fakeSaleItem} from './fake-sale-item';

describe('A sale item', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should generate a new entity', () => {
            const saleId = SaleId.generate();
            const productId = ProductId.generate();

            const saleItem = SaleItem.create({
                saleId,
                productId,
                price: 10.2,
                quantity: 1,
                note: 'note',
            });

            expect(saleItem.id).toBeInstanceOf(SaleItemId);
            expect(saleItem.saleId).toBe(saleId);
            expect(saleItem.productId).toBe(productId);
            expect(saleItem.createdAt).toStrictEqual(now);
            expect(saleItem.updatedAt).toStrictEqual(now);

            expect(saleItem).toBeInstanceOf(SaleItem);
        });

        it.each([
            [{quantity: 0}, 'Sale item quantity must be at least 1.'],
            [{price: -100}, 'Sale item price cannot be negative.'],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            expect(() => SaleItem.create({...fakeSaleItem(), ...input})).toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on change', () => {
        it('should update values', () => {
            const saleItem = fakeSaleItem({
                quantity: 2,
                note: 'note',
            });

            saleItem.change({
                quantity: 4,
                note: 'new note',
            });

            expect(saleItem.quantity).toBe(4);
            expect(saleItem.note).toBe('new note');
            expect(saleItem.updatedAt).toEqual(now);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() => fakeSaleItem({quantity: 0})).toThrow('Sale item quantity must be at least 1.');
        });
    });

    it('should be serializable', () => {
        const saleItem = fakeSaleItem({
            price: 15.59,
            quantity: 2,
            note: 'note',
            canceledAt: new Date(1000),
            canceledBy: null,
            canceledReason: 'reason',
        });

        expect(saleItem.toJSON()).toEqual({
            id: saleItem.id.toJSON(),
            saleId: saleItem.saleId.toJSON(),
            productId: saleItem.productId.toJSON(),
            price: 15.59,
            quantity: 2,
            note: 'note',
            canceledAt: new Date(1000).toJSON(),
            canceledBy: null,
            canceledReason: 'reason',
            createdAt: saleItem.createdAt.toJSON(),
            updatedAt: saleItem.updatedAt.toJSON(),
        });
    });
});
