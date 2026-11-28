import {z} from 'zod';
import {entityId} from '@application/@shared/validation/schemas';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import {FinancialAccountId} from '@domain/financial-account/entities';

/** Formas que movem dinheiro e podem compor um recebimento. */
export const ledgerPaymentMethodSchema = z.enum([
    PaymentMethod.CASH,
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BANK_TRANSFER,
]);

export const receiptPartSchema = z.object({
    paymentMethod: ledgerPaymentMethodSchema,
    amountBrl: z.number().positive().multipleOf(0.01),
    /** Conta que recebe a parte. Sem conta, vai para a conta padrão da forma. */
    accountId: entityId(FinancialAccountId).nullish(),
});

export const receiptPartsSchema = z.array(receiptPartSchema).min(1).max(10);
