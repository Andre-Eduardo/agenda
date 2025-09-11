import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {UserId} from '../user/entities';
import type {EmployeePosition, EmployeePositionId} from './entities';

export type EmployeePositionSearchFilter = {
    name?: string;
};

export type EmployeePositionSortOptions = ['name', 'createdAt', 'updatedAt'];

export interface EmployeePositionRepository {
    findById(id: EmployeePositionId): Promise<EmployeePosition | null>;

    findByUser(companyId: CompanyId, userId: UserId): Promise<EmployeePosition | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<EmployeePositionSortOptions>,
        filter?: EmployeePositionSearchFilter
    ): Promise<PaginatedList<EmployeePosition>>;

    save(employeePosition: EmployeePosition): Promise<void>;

    delete(id: EmployeePositionId): Promise<void>;
}

export abstract class EmployeePositionRepository {}
