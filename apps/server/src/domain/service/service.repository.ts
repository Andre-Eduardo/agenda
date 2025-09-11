import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {ServiceCategoryId} from '../service-category/entities';
import type {Service, ServiceId} from './entities';

export type ServiceSearchFilter = {
    name?: string;
    categoryId?: ServiceCategoryId;
    code?: number;
    price?: number;
};

export type ServiceSortOptions = ['name', 'code', 'price', 'createdAt', 'updatedAt'];

export interface ServiceRepository {
    findById(id: ServiceId): Promise<Service | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<ServiceSortOptions>,
        filter?: ServiceSearchFilter
    ): Promise<PaginatedList<Service>>;

    save(service: Service): Promise<void>;

    delete(id: ServiceId): Promise<void>;
}

export abstract class ServiceRepository {}
