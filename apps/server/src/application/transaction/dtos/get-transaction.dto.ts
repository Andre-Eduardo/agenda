import {z} from 'zod';
import {TransactionId} from '../../../domain/transaction/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getTransactionSchema = z.object({
    id: entityId(TransactionId),
});

export class GetTransactionDto extends createZodDto(getTransactionSchema) {}
