import {z} from 'zod';
import {PaymentMethodId} from '../../../domain/payment-method/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deletePaymentMethodSchema = z.object({
    id: entityId(PaymentMethodId),
});

export class DeletePaymentMethodDto extends createZodDto(deletePaymentMethodSchema) {}
