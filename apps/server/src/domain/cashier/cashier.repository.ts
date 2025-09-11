import type {PaginatedList, Pagination, RangeFilter} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {UserId} from '../user/entities';
import type {Cashier, CashierId} from './entities';

export type CashierSearchFilter = {
    userId?: UserId;
    createdAt?: RangeFilter<Date>;
    closedAt?: RangeFilter<Date> | null;
};

export type CashierSortOptions = ['createdAt', 'updatedAt', 'closedAt'];

export interface CashierRepository {
    findById(id: CashierId): Promise<Cashier | null>;

    /**
     * Finds the cashier that is currently opened by the user.
     */
    findOpened(companyId: CompanyId, userId: UserId): Promise<Cashier | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<CashierSortOptions>,
        filter?: CashierSearchFilter
    ): Promise<PaginatedList<Cashier>>;

    save(cashier: Cashier): Promise<void>;
}

export abstract class CashierRepository {}
