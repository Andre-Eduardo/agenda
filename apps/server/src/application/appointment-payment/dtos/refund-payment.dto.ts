import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const refundPaymentSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});

export class RefundPaymentDto extends createZodDto(refundPaymentSchema) {}
