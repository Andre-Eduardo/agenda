import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {PaymentMethod, PaymentMethodId, PaymentMethodType} from './entities';

export type PaymentMethodSearchFilter = {
    name?: string;
    type?: PaymentMethodType;
};

export type PaymentMethodSortOptions = ['name', 'type', 'createdAt', 'updatedAt'];

export interface PaymentMethodRepository {
    findById(id: PaymentMethodId): Promise<PaymentMethod | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<PaymentMethodSortOptions>,
        filter?: PaymentMethodSearchFilter
    ): Promise<PaginatedList<PaymentMethod>>;

    save(paymentMethod: PaymentMethod): Promise<void>;

    delete(id: PaymentMethodId): Promise<void>;
}

export abstract class PaymentMethodRepository {}
