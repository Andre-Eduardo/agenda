import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomCategoryId} from '../room-category/entities';
import type {Room, RoomId} from './entities';

export type RoomSearchFilter = {
    name?: string;
    number?: number;
    categoryId?: RoomCategoryId;
};

export type RoomSortOptions = ['name', 'number', 'createdAt', 'updatedAt'];

export interface RoomRepository {
    findById(id: RoomId): Promise<Room | null>;

    findAll(): Promise<Room[]>;

    search(
        companyId: CompanyId,
        pagination: Pagination<RoomSortOptions>,
        filter?: RoomSearchFilter
    ): Promise<PaginatedList<Room>>;

    save(room: Room): Promise<void>;

    delete(id: RoomId): Promise<void>;
}

export abstract class RoomRepository {}
