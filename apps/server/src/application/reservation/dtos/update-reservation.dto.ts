import type {z} from 'zod';
import {ReservationId} from '../../../domain/reservation/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createReservationSchema} from './create-reservation.dto';

const updateReservationInputSchema = createReservationSchema.omit({companyId: true}).partial();

export class UpdateReservationInputDto extends createZodDto(updateReservationInputSchema) {}

export const updateReservationSchema = updateReservationInputSchema.extend({
    id: entityId(ReservationId),
});

export type UpdateReservationDto = z.infer<typeof updateReservationSchema>;
