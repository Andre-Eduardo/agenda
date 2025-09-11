import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {DeepCleaning, DeepCleaningEndReasonType} from './entities';

export type DeepCleaningSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    endReason?: DeepCleaningEndReasonType;
};

export type DeepCleaningSortOptions = ['endReason', 'createdAt', 'finishedAt'];

export interface DeepCleaningRepository {
    findById(id: RoomStatusId): Promise<DeepCleaning | null>;

    findByRoom(roomId: RoomId): Promise<DeepCleaning | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<DeepCleaningSortOptions>,
        filter?: DeepCleaningSearchFilter
    ): Promise<PaginatedList<DeepCleaning>>;

    save(deepCleaning: DeepCleaning): Promise<void>;
}

export abstract class DeepCleaningRepository {}
