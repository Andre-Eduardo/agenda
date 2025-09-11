import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {Stock, StockId, StockType} from './entities';

export type StockSearchFilter = {
    name?: string;
    roomId?: RoomId;
    type?: StockType;
};

export type StockSortOptions = ['name', 'type', 'createdAt', 'updatedAt'];

export interface StockRepository {
    findById(id: StockId): Promise<Stock | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<StockSortOptions>,
        filter?: StockSearchFilter
    ): Promise<PaginatedList<Stock>>;

    save(stock: Stock): Promise<void>;

    delete(id: StockId): Promise<void>;
}

export abstract class StockRepository {}
