import type {z} from 'zod';
import {TransactionId} from '../../../domain/transaction/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createTransactionSchema} from './create-transaction.dto';

const updateTransactionInputSchema = createTransactionSchema.partial();

export class UpdateTransactionInputDto extends createZodDto(updateTransactionInputSchema) {}

export const updateTransactionSchema = updateTransactionInputSchema.extend({
    id: entityId(TransactionId),
});

export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
