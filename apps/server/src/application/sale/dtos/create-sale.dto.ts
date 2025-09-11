import {getSchemaPath} from '@nestjs/swagger';
import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {ProductId} from '../../../domain/product/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createSaleItemSchema = z.object({
    productId: entityId(ProductId),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    note: z.string().min(1).nullish(),
});

export class CreateSaleItemDto extends createZodDto(createSaleItemSchema) {}

export const createSaleSchema = z.object({
    companyId: entityId(CompanyId),
    items: z
        .array(createSaleItemSchema)
        .min(1)
        .openapi({
            items: {
                $ref: getSchemaPath(CreateSaleItemDto),
            },
        }),
    note: z.string().min(1).nullish(),
});
