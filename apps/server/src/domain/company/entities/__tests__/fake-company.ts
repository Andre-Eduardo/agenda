import {Company, CompanyId} from '../company.entity';

export function fakeCompany(payload: Partial<Company> = {}): Company {
    return new Company({
        id: CompanyId.generate(),
        name: 'Ecxus',
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
