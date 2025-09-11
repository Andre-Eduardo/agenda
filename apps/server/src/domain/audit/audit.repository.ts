import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {RoomId} from '../room/entities';
import type {RoomStatusId} from '../room-status/entities';
import type {UserId} from '../user/entities';
import type {Audit, AuditEndReasonType} from './entities';

export type AuditSearchFilter = {
    roomId?: RoomId;
    startedById?: UserId;
    finishedById?: UserId;
    reason?: string;
    endReason?: AuditEndReasonType;
};

export type AuditSortOptions = ['reason', 'endReason', 'createdAt', 'updatedAt'];

export interface AuditRepository {
    findById(id: RoomStatusId): Promise<Audit | null>;

    findByRoom(roomId: RoomId): Promise<Audit | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<AuditSortOptions>,
        filter?: AuditSearchFilter
    ): Promise<PaginatedList<Audit>>;

    save(audit: Audit): Promise<void>;
}

export abstract class AuditRepository {}
