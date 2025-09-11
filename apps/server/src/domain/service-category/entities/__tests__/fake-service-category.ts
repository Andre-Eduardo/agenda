import {CompanyId} from '../../../company/entities';
import {ServiceCategory, ServiceCategoryId} from '../service-category.entity';

export function fakeServiceCategory(payload: Partial<ServiceCategory> = {}): ServiceCategory {
    return new ServiceCategory({
        id: ServiceCategoryId.generate(),
        companyId: CompanyId.generate(),
        name: 'Decoration',
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
