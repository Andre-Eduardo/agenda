import {z} from 'zod';
import {ProductId} from '../../../domain/product/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteProductSchema = z.object({
    id: entityId(ProductId),
});

export class DeleteProductDto extends createZodDto(deleteProductSchema) {}
