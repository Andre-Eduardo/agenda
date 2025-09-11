import type {PaginatedList, Pagination} from '../@shared/repository';
import type {DocumentId, Phone} from '../@shared/value-objects';
import type {CompanyId} from '../company/entities';
import type {Gender, PersonId, PersonProfile, PersonType} from '../person/entities';
import type {Supplier} from './entities';

export type SupplierSearchFilter = {
    name?: string;
    companyName?: string;
    documentId?: DocumentId;
    personType?: PersonType;
    phone?: Phone;
    gender?: Gender;
    profiles?: PersonProfile[];
};

export type SupplierSortOptions = ['name', 'companyName', 'personType', 'gender', 'createdAt', 'updatedAt'];

export interface SupplierRepository {
    findById(id: PersonId): Promise<Supplier | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<SupplierSortOptions>,
        filter?: SupplierSearchFilter
    ): Promise<PaginatedList<Supplier>>;

    save(supplier: Supplier): Promise<void>;

    delete(id: PersonId): Promise<void>;
}

export abstract class SupplierRepository {}
