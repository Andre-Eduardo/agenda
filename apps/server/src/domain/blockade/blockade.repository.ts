import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {Blockade} from './entities';

export type BlockadeSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    note?: string;
};

export type BlockadeSortOptions = ['note', 'createdAt', 'finishedAt'];

export interface BlockadeRepository {
    findById(id: RoomStatusId): Promise<Blockade | null>;

    findByRoom(roomId: RoomId): Promise<Blockade | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<BlockadeSortOptions>,
        filter?: BlockadeSearchFilter
    ): Promise<PaginatedList<Blockade>>;

    save(blockade: Blockade): Promise<void>;
}

export abstract class BlockadeRepository {}
