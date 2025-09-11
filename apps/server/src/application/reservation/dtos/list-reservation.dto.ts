import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PersonId} from '../../../domain/person/entities';
import type {ReservationSortOptions} from '../../../domain/reservation/reservation.repository';
import {RoomId} from '../../../domain/room/entities';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {datetime} from '../../@shared/validation/schemas/datetime.schema';
import {nullableRangeFilter, rangeFilter} from '../../@shared/validation/schemas/range-filter.schema';

const listReservationSchema = z.object({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).optional().openapi({
        description: 'The room to search for.',
    }),
    roomCategoryId: entityId(RoomCategoryId).optional().openapi({
        description: 'The room category to search for.',
    }),
    checkIn: rangeFilter(datetime).optional().openapi({
        description: 'The range of check-in dates to search for.',
    }),
    bookedBy: entityId(UserId).optional().openapi({
        description: 'The user who made the reservation to search for.',
    }),
    bookedFor: entityId(PersonId).optional().openapi({
        description: 'The person for whom the reservation was made to search for.',
    }),
    canceledAt: nullableRangeFilter(datetime).nullish().openapi({
        description: 'The range of cancellation dates to search for.',
    }),
    canceledBy: entityId(UserId).optional().openapi({
        description: 'The user who canceled the reservation to search for.',
    }),
    noShow: z.boolean().optional().openapi({
        description: 'The flag to search for reservations that were marked as no-show.',
    }),
    pagination: pagination(<ReservationSortOptions>['checkIn', 'canceledAt', 'createdAt', 'updatedAt']),
});

export class ListReservationDto extends createZodDto(listReservationSchema) {}
