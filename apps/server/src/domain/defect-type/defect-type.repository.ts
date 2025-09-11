import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {DefectType, DefectTypeId} from './entities';

export type DefectTypeSearchFilter = {
    name?: string;
};

export type DefectTypeSortOptions = ['name', 'createdAt', 'updatedAt'];

export interface DefectTypeRepository {
    findById(id: DefectTypeId): Promise<DefectType | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<DefectTypeSortOptions>,
        filter?: DefectTypeSearchFilter
    ): Promise<PaginatedList<DefectType>>;

    save(defectType: DefectType): Promise<void>;

    delete(id: DefectTypeId): Promise<void>;
}

export abstract class DefectTypeRepository {}
