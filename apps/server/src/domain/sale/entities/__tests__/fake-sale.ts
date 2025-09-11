import {CompanyId} from '../../../company/entities';
import {UserId} from '../../../user/entities';
import {Sale, SaleId} from '../index';
import {fakeSaleItem} from './fake-sale-item';

export function fakeSale(payload: Partial<Sale> = {}): Sale {
    const saleId = payload.id ?? SaleId.generate();

    return new Sale({
        id: saleId,
        companyId: CompanyId.generate(),
        sellerId: UserId.generate(),
        note: null,
        items: [fakeSaleItem({saleId})],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
