import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';

export const searchProfessionalsSchema = pagination(['createdAt', 'updatedAt'] as const).extend({
    term: z
        .string()
        .optional()
        .openapi({description: 'Search term to filter by name, document ID or specialty'}),
});

export class SearchProfessionalsDto extends createZodDto(searchProfessionalsSchema) {}
