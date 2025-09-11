import {z} from 'zod';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteProductCategorySchema = z.object({
    id: entityId(ProductCategoryId),
});

export class DeleteProductCategoryDto extends createZodDto(deleteProductCategorySchema) {}
