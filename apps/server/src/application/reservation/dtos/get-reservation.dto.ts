import {z} from 'zod';
import {ReservationId} from '../../../domain/reservation/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getReservationSchema = z.object({
    id: entityId(ReservationId),
});

export class GetReservationDto extends createZodDto(getReservationSchema) {}
