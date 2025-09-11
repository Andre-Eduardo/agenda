import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PaymentMethodType} from '../../../domain/payment-method/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createPaymentMethodSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'Pix'}),
    type: z.nativeEnum(PaymentMethodType).openapi({example: PaymentMethodType.PIX, enumName: 'PaymentMethodType'}),
});

export class CreatePaymentMethodDto extends createZodDto(createPaymentMethodSchema) {}
