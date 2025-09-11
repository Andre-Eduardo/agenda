import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PaymentMethodType} from '../../../domain/payment-method/entities';
import type {PaymentMethodSortOptions} from '../../../domain/payment-method/payment-method.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listPaymentMethodSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    type: z
        .nativeEnum(PaymentMethodType)
        .optional()
        .openapi({description: 'The type to search for', enumName: 'PaymentMethodType'}),
    pagination: pagination(<PaymentMethodSortOptions>['name', 'type', 'createdAt', 'updatedAt']),
});

export class ListPaymentMethodDto extends createZodDto(listPaymentMethodSchema) {}
