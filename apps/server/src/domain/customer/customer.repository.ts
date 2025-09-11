import type {PaginatedList, Pagination} from '../@shared/repository';
import type {DocumentId, Phone} from '../@shared/value-objects';
import type {CompanyId} from '../company/entities';
import type {Gender, PersonId, PersonProfile, PersonType} from '../person/entities';
import type {Customer} from './entities';

export type CustomerSearchFilter = {
    name?: string;
    companyName?: string;
    documentId?: DocumentId;
    personType?: PersonType;
    phone?: Phone;
    gender?: Gender;
    profiles?: PersonProfile[];
};

export type CustomerSortOptions = ['name', 'companyName', 'personType', 'gender', 'createdAt', 'updatedAt'];

export interface CustomerRepository {
    findById(id: PersonId): Promise<Customer | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<CustomerSortOptions>,
        filter?: CustomerSearchFilter
    ): Promise<PaginatedList<Customer>>;

    save(customer: Customer): Promise<void>;

    delete(id: PersonId): Promise<void>;
}

export abstract class CustomerRepository {}
