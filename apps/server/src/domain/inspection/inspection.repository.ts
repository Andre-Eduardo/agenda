import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {Inspection, InspectionEndReasonType} from './entities';

export type InspectionSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    endReason?: InspectionEndReasonType;
};

export type InspectionSortOptions = ['endReason', 'createdAt', 'finishedAt'];

export interface InspectionRepository {
    findById(id: RoomStatusId): Promise<Inspection | null>;

    findByRoom(roomId: RoomId): Promise<Inspection | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<InspectionSortOptions>,
        filter?: InspectionSearchFilter
    ): Promise<PaginatedList<Inspection>>;

    save(inspection: Inspection): Promise<void>;
}

export abstract class InspectionRepository {}
