import {CompanyId} from '../../../company/entities';
import {ServiceCategoryId} from '../../../service-category/entities';
import {Service, ServiceId} from '../service.entity';

export function fakeService(payload: Partial<Service> = {}): Service {
    return new Service({
        id: ServiceId.generate(),
        companyId: CompanyId.generate(),
        categoryId: ServiceCategoryId.generate(),
        name: 'Special decoration',
        code: 10,
        price: 150,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
