import {CompanyId} from '../../../company/entities';
import {Stock, StockId, StockType} from '../stock.entity';

export function fakeStock(payload: Partial<Stock> = {}): Stock {
    return new Stock({
        id: StockId.generate(),
        companyId: CompanyId.generate(),
        name: null,
        type: StockType.MAIN,
        roomId: null,
        parentId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
