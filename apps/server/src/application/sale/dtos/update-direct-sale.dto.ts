import {ApiExtraModels, refs} from '@nestjs/swagger';
import {z} from 'zod';
import {SaleId, SaleItemId} from '../../../domain/sale/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {updateTransactionSchema} from '../../transaction/dtos';
import {
    createDirectSaleSchema,
    CreateDirectSaleTransactionDto,
    createDirectSaleTransactionSchema,
} from './create-direct-sale.dto';
import {CreateSaleItemDto, createSaleItemSchema} from './create-sale.dto';

const updateDirectSaleItemSchema = createSaleItemSchema.partial().extend({id: entityId(SaleItemId)});

class UpdateDirectSaleItemDto extends createZodDto(updateDirectSaleItemSchema) {}

const updateDirectSaleTransactionSchema = updateTransactionSchema.pick({
    id: true,
    amount: true,
    description: true,
});

class UpdateDirectSaleTransactionDto extends createZodDto(updateDirectSaleTransactionSchema) {}

const updateDirectSaleInputSchema = createDirectSaleSchema
    .omit({companyId: true})
    .extend({
        items: z
            .array(z.union([updateDirectSaleItemSchema, createSaleItemSchema]))
            .min(1)
            .openapi({
                items: {
                    oneOf: refs(UpdateDirectSaleItemDto, CreateSaleItemDto),
                },
            }),
        transactions: z.array(z.union([updateDirectSaleTransactionSchema, createDirectSaleTransactionSchema])).openapi({
            items: {
                oneOf: refs(UpdateDirectSaleTransactionDto, CreateDirectSaleTransactionDto),
            },
        }),
    })
    .partial();

@ApiExtraModels(
    UpdateDirectSaleItemDto,
    CreateSaleItemDto,
    UpdateDirectSaleTransactionDto,
    CreateDirectSaleTransactionDto
)
export class UpdateDirectSaleInputDto extends createZodDto(updateDirectSaleInputSchema) {}

export const updateDirectSaleSchema = updateDirectSaleInputSchema.extend({
    id: entityId(SaleId),
});

export type UpdateDirectSaleDto = z.infer<typeof updateDirectSaleSchema>;
