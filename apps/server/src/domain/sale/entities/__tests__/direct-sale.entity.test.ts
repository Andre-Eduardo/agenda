import {ResourceNotFoundException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {PersonId} from '../../../person/entities';
import {ProductId} from '../../../product/entities';
import {UserId} from '../../../user/entities';
import {DirectSaleChangedEvent, DirectSaleCreatedEvent} from '../../events';
import type {UpdateDirectSale} from '../direct-sale.entity';
import {DirectSale} from '../direct-sale.entity';
import {SaleItem, SaleItemId} from '../sale-item.entity';
import {SaleId} from '../sale.entity';
import {fakeDirectSale} from './fake-direct-sale';
import {fakeSaleItem} from './fake-sale-item';

describe('A direct sale', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a direct-sale-created event', () => {
            const expected = {
                sellerId: UserId.generate(),
                buyerId: PersonId.generate(),
                productId: ProductId.generate(),
            };

            const directSale = DirectSale.create({
                companyId: CompanyId.generate(),
                sellerId: expected.sellerId,
                buyerId: expected.buyerId,
                items: [
                    {
                        productId: expected.productId,
                        price: 10.2,
                        quantity: 1,
                    },
                ],
                note: 'test',
            });

            expect(directSale.sellerId).toEqual(expected.sellerId);
            expect(directSale.buyerId).toEqual(expected.buyerId);
            expect(directSale.items).toEqual([
                new SaleItem({
                    id: directSale.items[0].id,
                    saleId: directSale.id,
                    productId: expected.productId,
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
            expect(directSale.note).toEqual('test');

            expect(directSale.events).toEqual([
                {
                    type: DirectSaleCreatedEvent.type,
                    companyId: directSale.companyId,
                    timestamp: now,
                    directSale,
                },
            ]);
            expect(directSale.events[0]).toBeInstanceOf(DirectSaleCreatedEvent);
        });
    });

    describe('on change', () => {
        it('should emit a direct-sale-changed event', () => {
            const saleId = SaleId.generate();

            const directSale = fakeDirectSale({
                id: saleId,
                note: 'test',
                items: [
                    fakeSaleItem({
                        saleId,
                        quantity: 1,
                        price: 100,
                        note: null,
                    }),
                ],
            });

            const oldEmployee = new DirectSale(directSale);

            const data: UpdateDirectSale = {
                note: 'new note',
                items: [
                    {
                        id: directSale.items[0].id,
                        quantity: 3,
                        note: 'Product Note',
                    },
                ],
            };

            directSale.change(data);

            expect(directSale.note).toEqual(data.note);
            expect(directSale.items).toEqual([
                new SaleItem({
                    ...directSale.items[0],
                    quantity: 3,
                    note: 'Product Note',
                    updatedAt: now,
                }),
            ]);

            expect(directSale.events).toEqual([
                {
                    type: DirectSaleChangedEvent.type,
                    timestamp: now,
                    companyId: directSale.companyId,
                    oldState: oldEmployee,
                    newState: directSale,
                },
            ]);
            expect(directSale.events[0]).toBeInstanceOf(DirectSaleChangedEvent);
        });

        it('should throw an error when receiving invalid items', () => {
            const directSale = fakeDirectSale();

            expect(() => directSale.change({items: [{id: SaleItemId.generate()}]})).toThrowWithMessage(
                ResourceNotFoundException,
                'Sale item not found'
            );
        });
    });

    it.each([PersonId.generate(), null])('should be serializable', (buyerId) => {
        const directSale = fakeDirectSale({
            buyerId,
            note: 'note',
        });

        expect(directSale.toJSON()).toEqual({
            id: directSale.id.toJSON(),
            companyId: directSale.companyId.toJSON(),
            sellerId: directSale.sellerId.toJSON(),
            buyerId: buyerId?.toJSON() ?? null,
            items: directSale.items.map((prod) => prod.toJSON()),
            note: 'note',
            createdAt: directSale.createdAt.toJSON(),
            updatedAt: directSale.updatedAt.toJSON(),
        });
    });
});
