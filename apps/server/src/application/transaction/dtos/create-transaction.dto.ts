import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PaymentMethodId} from '../../../domain/payment-method/entities';
import {PersonId} from '../../../domain/person/entities';
import {TransactionType} from '../../../domain/transaction/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createTransactionSchema = z.object({
    companyId: entityId(CompanyId),
    counterpartyId: entityId(PersonId).nullish(),
    responsibleId: entityId(UserId),
    amount: z.number().positive().openapi({example: 100.0}),
    paymentMethodId: entityId(PaymentMethodId),
    description: z.string().min(1).nullish().openapi({example: 'transaction card'}),
    type: z.nativeEnum(TransactionType).openapi({example: TransactionType.EXPENSE, enumName: 'TransactionType'}),
});

export class CreateTransactionDto extends createZodDto(createTransactionSchema) {}
