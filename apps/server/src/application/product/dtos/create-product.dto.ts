import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createProductSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(ProductCategoryId),
    name: z.string().min(1).openapi({example: 'Whiskey'}),
    code: z.number().int().positive().openapi({example: 141}),
    price: z.number().nonnegative().openapi({example: 100.0}),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}
