import type {PaginatedList, Pagination, RangeFilter} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {PaymentMethodId} from '../payment-method/entities';
import type {PersonId} from '../person/entities';
import type {ReservationId} from '../reservation/entities';
import type {SaleId} from '../sale/entities';
import type {UserId} from '../user/entities';
import type {Transaction, TransactionId, TransactionOriginType, TransactionType} from './entities';

export type TransactionSearchFilter = {
    ids?: TransactionId[];
    amount?: RangeFilter<number>;
    paymentMethodId?: PaymentMethodId;
    counterpartyId?: PersonId | null;
    responsibleId?: UserId;
    description?: string;
    originId?: ReservationId | SaleId | null;
    originType?: TransactionOriginType;
    type?: TransactionType;
};

export type TransactionSortOptions = ['description', 'originType', 'type', 'amount', 'createdAt', 'updatedAt'];

export interface TransactionRepository {
    findById(id: TransactionId): Promise<Transaction | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<TransactionSortOptions>,
        filter?: TransactionSearchFilter
    ): Promise<PaginatedList<Transaction>>;

    save(transaction: Transaction): Promise<void>;
}

export abstract class TransactionRepository {}
