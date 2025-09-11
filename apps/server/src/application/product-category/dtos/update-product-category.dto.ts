import type {z} from 'zod';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createProductCategorySchema} from './create-product-category.dto';

const updateProductCategoryInputSchema = createProductCategorySchema.omit({companyId: true}).partial();

export class UpdateProductCategoryInputDto extends createZodDto(updateProductCategoryInputSchema) {}

export const updateProductCategorySchema = updateProductCategoryInputSchema.extend({
    id: entityId(ProductCategoryId),
});

export type UpdateProductCategoryDto = z.infer<typeof updateProductCategorySchema>;
