import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {Cleaning, CleaningEndReasonType} from './entities';

export type CleaningSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    endReason?: CleaningEndReasonType;
};

export type CleaningSortOptions = ['endReason', 'createdAt', 'finishedAt'];

export interface CleaningRepository {
    findById(id: RoomStatusId): Promise<Cleaning | null>;

    findByRoom(roomId: RoomId): Promise<Cleaning | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<CleaningSortOptions>,
        filter?: CleaningSearchFilter
    ): Promise<PaginatedList<Cleaning>>;

    save(cleaning: Cleaning): Promise<void>;
}

export abstract class CleaningRepository {}
