import {ApiExtraModels, getSchemaPath} from '@nestjs/swagger';
import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createTransactionSchema} from '../../transaction/dtos';
import {CreateSaleItemDto, createSaleSchema} from './create-sale.dto';

export const createDirectSaleTransactionSchema = createTransactionSchema.pick({
    amount: true,
    paymentMethodId: true,
});

export class CreateDirectSaleTransactionDto extends createZodDto(createDirectSaleTransactionSchema) {}

const newDirectSaleSchema = z.object({
    buyerId: entityId(PersonId).nullish(),
    transactions: z.array(createDirectSaleTransactionSchema).openapi({
        items: {
            $ref: getSchemaPath(CreateDirectSaleTransactionDto),
        },
    }),
});

export const createDirectSaleSchema = createSaleSchema.merge(newDirectSaleSchema).openapi({
    description: 'Create a new direct sale with the given data',
});

@ApiExtraModels(CreateSaleItemDto, CreateDirectSaleTransactionDto)
export class CreateDirectSaleDto extends createZodDto(createDirectSaleSchema) {}
