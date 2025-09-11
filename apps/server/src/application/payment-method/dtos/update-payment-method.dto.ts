import type {z} from 'zod';
import {PaymentMethodId} from '../../../domain/payment-method/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createPaymentMethodSchema} from './create-payment-method.dto';

const updatePaymentMethodInputSchema = createPaymentMethodSchema.omit({companyId: true}).partial();

export class UpdatePaymentMethodInputDto extends createZodDto(updatePaymentMethodInputSchema) {}

export const updatePaymentMethodSchema = updatePaymentMethodInputSchema.extend({
    id: entityId(PaymentMethodId),
});

export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>;
