import {z} from 'zod';
import {ReservationId} from '../../../domain/reservation/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const cancelReservationInputSchema = z.object({
    canceledReason: z.string().nullish(),
});

export class CancelReservationInputDto extends createZodDto(cancelReservationInputSchema) {}

export const cancelReservationSchema = cancelReservationInputSchema.extend({
    id: entityId(ReservationId),
});

export class CancelReservationDto extends createZodDto(cancelReservationSchema) {}
