import {ProductId} from '../../../product/entities';
import {SaleId, SaleItem, SaleItemId} from '../index';

export function fakeSaleItem(payload: Partial<SaleItem> = {}): SaleItem {
    return new SaleItem({
        id: SaleItemId.generate(),
        saleId: SaleId.generate(),
        productId: ProductId.generate(),
        price: 10.2,
        quantity: 3,
        note: 'note',
        canceledAt: null,
        canceledBy: null,
        canceledReason: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
