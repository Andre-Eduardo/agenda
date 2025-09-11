import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PaymentMethodId} from '../../../domain/payment-method/entities';
import {PersonId} from '../../../domain/person/entities';
import {ReservationId} from '../../../domain/reservation/entities';
import {SaleId} from '../../../domain/sale/entities';
import {TransactionOriginType, TransactionType} from '../../../domain/transaction/entities';
import type {TransactionSortOptions} from '../../../domain/transaction/transaction.repository';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {rangeFilter} from '../../@shared/validation/schemas/range-filter.schema';

const listTransactionSchema = z.object({
    companyId: entityId(CompanyId),
    amount: rangeFilter(z.coerce.number()).optional(),
    paymentMethodId: entityId(PaymentMethodId).optional(),
    counterpartyId: entityId(PersonId).nullish(),
    responsibleId: entityId(UserId).optional(),
    description: z.string().min(1).optional().openapi({example: 'transaction card'}),
    originId: z
        .union([entityId(ReservationId), entityId(SaleId)])
        .nullish()
        .openapi({
            type: 'string',
            format: 'uuid',
            nullable: true,
        }),
    originType: z
        .nativeEnum(TransactionOriginType)
        .optional()
        .openapi({example: TransactionOriginType.RESERVATION, enumName: 'TransactionOriginType'}),
    type: z
        .nativeEnum(TransactionType)
        .optional()
        .openapi({example: TransactionType.EXPENSE, enumName: 'TransactionType'}),
    pagination: pagination(<TransactionSortOptions>[
        'description',
        'originType',
        'type',
        'amount',
        'createdAt',
        'updatedAt',
    ]),
});

export class ListTransactionDto extends createZodDto(listTransactionSchema) {}
