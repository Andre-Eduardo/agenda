import type {PaginatedList, Pagination} from '../@shared/repository';
import type {Company, CompanyId} from './entities';

export type CompanySearchFilter = {
    name?: string;
};

export type CompanySortOptions = ['name', 'createdAt', 'updatedAt'];

export interface CompanyRepository {
    findById(id: CompanyId): Promise<Company | null>;

    search(pagination: Pagination<CompanySortOptions>, filter?: CompanySearchFilter): Promise<PaginatedList<Company>>;

    save(company: Company): Promise<void>;

    delete(id: CompanyId): Promise<void>;
}

export abstract class CompanyRepository {}
