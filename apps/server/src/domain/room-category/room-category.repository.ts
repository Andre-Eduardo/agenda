import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomCategory, RoomCategoryId} from './entities';

export type CategorySearchFilter = {
    name?: string;
    acronym?: string;
};

export type RoomCategorySortOptions = ['name', 'acronym', 'createdAt', 'updatedAt'];

export interface RoomCategoryRepository {
    findById(id: RoomCategoryId): Promise<RoomCategory | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<RoomCategorySortOptions>,
        filter?: CategorySearchFilter
    ): Promise<PaginatedList<RoomCategory>>;

    save(roomCategory: RoomCategory): Promise<void>;

    delete(id: RoomCategoryId): Promise<void>;
}

export abstract class RoomCategoryRepository {}
