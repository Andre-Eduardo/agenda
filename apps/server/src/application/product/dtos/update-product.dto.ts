import type {z} from 'zod';
import {ProductId} from '../../../domain/product/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createProductSchema} from './create-product.dto';

const updateProductInputSchema = createProductSchema.partial();

export class UpdateProductInputDto extends createZodDto(updateProductInputSchema) {}

export const updateProductSchema = updateProductInputSchema.extend({
    id: entityId(ProductId),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
