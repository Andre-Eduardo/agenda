import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {Maintenance} from './entities';

export type MaintenanceSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    note?: string;
};

export type MaintenanceSortOptions = ['note', 'createdAt', 'finishedAt'];

export interface MaintenanceRepository {
    findById(id: RoomStatusId): Promise<Maintenance | null>;

    findByRoom(roomId: RoomId): Promise<Maintenance | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<MaintenanceSortOptions>,
        filter?: MaintenanceSearchFilter
    ): Promise<PaginatedList<Maintenance>>;

    save(maintenance: Maintenance): Promise<void>;
}

export abstract class MaintenanceRepository {}
