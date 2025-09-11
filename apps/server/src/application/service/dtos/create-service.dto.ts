import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createServiceSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(ServiceCategoryId),
    name: z.string().min(1).openapi({example: 'Special decorating'}),
    code: z.number().int().positive().openapi({example: 1}),
    price: z.number().nonnegative().openapi({example: 89.0}),
});

export class CreateServiceDto extends createZodDto(createServiceSchema) {}
