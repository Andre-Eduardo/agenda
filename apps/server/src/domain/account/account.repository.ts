import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {Account, AccountId, AccountType} from './entities';

export type AccountSearchFilter = {
    name?: string;
    type?: AccountType;
};

export type AccountSortOptions = ['name', 'type', 'createdAt', 'updatedAt'];

export interface AccountRepository {
    findById(id: AccountId): Promise<Account | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<AccountSortOptions>,
        filter?: AccountSearchFilter
    ): Promise<PaginatedList<Account>>;

    save(account: Account): Promise<void>;

    delete(id: AccountId): Promise<void>;
}

export abstract class AccountRepository {}
