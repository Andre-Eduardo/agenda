import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {ServiceCategory, ServiceCategoryId} from './entities';

export type ServiceCategorySearchFilter = {
    name?: string;
};

export type ServiceCategorySortOptions = ['name', 'createdAt', 'updatedAt'];

export interface ServiceCategoryRepository {
    findById(id: ServiceCategoryId): Promise<ServiceCategory | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<ServiceCategorySortOptions>,
        filter?: ServiceCategorySearchFilter
    ): Promise<PaginatedList<ServiceCategory>>;

    save(serviceCategory: ServiceCategory): Promise<void>;

    delete(id: ServiceCategoryId): Promise<void>;
}

export abstract class ServiceCategoryRepository {}
