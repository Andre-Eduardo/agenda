import type {PaginatedList, Pagination, RangeFilter} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {PersonId} from '../person/entities';
import type {ProductId} from '../product/entities';
import type {UserId} from '../user/entities';
import type {DirectSale, SaleId} from './entities';

export type SaleItemSearchFilter = {
    saleId?: SaleId;
    productId?: ProductId;
    price?: RangeFilter<number>;
    quantity?: RangeFilter<number>;
    createdAt?: RangeFilter<Date>;
    canceledAt?: RangeFilter<Date> | null;
    canceledBy?: UserId;
};

export type DirectSaleSearchFilter = {
    sellerId?: UserId;
    buyerId?: PersonId | null;
    items?: SaleItemSearchFilter;
    createdAt?: RangeFilter<Date>;
};

export type DirectSaleSortOptions = ['createdAt', 'updatedAt'];

export interface DirectSaleRepository {
    findById(id: SaleId): Promise<DirectSale | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<DirectSaleSortOptions>,
        filter?: DirectSaleSearchFilter
    ): Promise<PaginatedList<DirectSale>>;

    save(directSale: DirectSale): Promise<void>;
}

export abstract class DirectSaleRepository {}
