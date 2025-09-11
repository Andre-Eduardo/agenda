import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {DefectTypeId} from '../defect-type/entities';
import type {RoomId} from '../room/entities';
import type {UserId} from '../user/entities';
import type {Defect, DefectId} from './entities';

export type DefectSearchFilter = {
    defectIds?: DefectId[];
    note?: string;
    roomId?: RoomId;
    defectTypeId?: DefectTypeId;
    createdById?: UserId;
    finishedById?: UserId;
    finishedAt?: Date;
    createdAt?: Date;
};

export type DefectSortOptions = ['note', 'finishedAt', 'createdAt', 'updatedAt'];

export interface DefectRepository {
    findById(id: DefectId): Promise<Defect | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<DefectSortOptions>,
        filter?: DefectSearchFilter
    ): Promise<PaginatedList<Defect>>;

    save(defect: Defect): Promise<void>;

    delete(id: DefectId): Promise<void>;
}

export abstract class DefectRepository {}
