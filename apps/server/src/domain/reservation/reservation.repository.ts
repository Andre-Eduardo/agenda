import type {PaginatedList, Pagination, RangeFilter} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {PersonId} from '../person/entities';
import type {RoomId} from '../room/entities';
import type {RoomCategoryId} from '../room-category/entities';
import type {UserId} from '../user/entities';
import type {Reservation, ReservationId} from './entities';

export type ReservationSearchFilter = {
    roomId?: RoomId;
    roomCategoryId?: RoomCategoryId;
    checkIn?: RangeFilter<Date>;
    bookedBy?: UserId;
    bookedFor?: PersonId;
    canceledAt?: RangeFilter<Date> | null;
    canceledBy?: UserId;
    noShow?: boolean;
};

export type ReservationSortOptions = ['checkIn', 'canceledAt', 'createdAt', 'updatedAt'];

export interface ReservationRepository {
    findById(id: ReservationId): Promise<Reservation | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<ReservationSortOptions>,
        filter?: ReservationSearchFilter
    ): Promise<PaginatedList<Reservation>>;

    save(roomCategory: Reservation): Promise<void>;
}

export abstract class ReservationRepository {}
