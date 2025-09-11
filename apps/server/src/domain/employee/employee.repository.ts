import type {PaginatedList, Pagination} from '../@shared/repository';
import type {DocumentId, Phone} from '../@shared/value-objects';
import type {CompanyId} from '../company/entities';
import type {EmployeePositionId} from '../employee-position/entities';
import type {Gender, PersonId, PersonProfile, PersonType} from '../person/entities';
import type {Employee} from './entities';

export type EmployeeSearchFilter = {
    name?: string;
    companyName?: string;
    documentId?: DocumentId;
    personType?: PersonType;
    phone?: Phone;
    gender?: Gender;
    positionId?: EmployeePositionId;
    profiles?: PersonProfile[];
};

export type EmployeeSortOptions = ['name', 'companyName', 'personType', 'gender', 'createdAt', 'updatedAt'];

export interface EmployeeRepository {
    findById(id: PersonId): Promise<Employee | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<EmployeeSortOptions>,
        filter?: EmployeeSearchFilter
    ): Promise<PaginatedList<Employee>>;

    save(employee: Employee): Promise<void>;

    delete(id: PersonId): Promise<void>;
}

export abstract class EmployeeRepository {}
