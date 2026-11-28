import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {receiptPartsSchema} from '@application/appointment-payment/dtos/receipt-part.dto';

export const receivePaymentSchema = z.object({
    parts: receiptPartsSchema,
});

export class ReceivePaymentDto extends createZodDto(receivePaymentSchema) {}
