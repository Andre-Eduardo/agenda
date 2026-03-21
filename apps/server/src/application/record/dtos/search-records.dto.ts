import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';

export const searchRecordsSchema = pagination(['createdAt', 'updatedAt'] as const).extend({
    term: z.string().optional().openapi({description: 'Search term to filter records by description'}),
});

export class SearchRecordsDto extends createZodDto(searchRecordsSchema) {}
