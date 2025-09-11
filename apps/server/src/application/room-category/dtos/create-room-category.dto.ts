import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createRoomCategorySchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'High Tech'}),
    acronym: z.string().min(1).max(2).openapi({example: 'HT'}),
    guestCount: z.number().int().positive().openapi({example: 2}),
});

export class CreateRoomCategoryDto extends createZodDto(createRoomCategorySchema) {}
