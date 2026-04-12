import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';

export const searchAppointmentsSchema = pagination(['createdAt', 'updatedAt', 'startAt'] as const).extend({
    term: z.string().optional().openapi({description: 'Search term to filter appointments by note'}),
});

export class SearchAppointmentsDto extends createZodDto(searchAppointmentsSchema) {}
