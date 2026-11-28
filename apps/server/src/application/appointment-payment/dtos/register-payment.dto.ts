import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {receiptPartsSchema} from '@application/appointment-payment/dtos/receipt-part.dto';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientPackageId} from '@domain/patient-package/entities';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities';

export const registerPaymentSchema = z.object({
    paymentMethod: z.enum([
        PaymentMethod.CASH,
        PaymentMethod.PIX,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.INSURANCE,
        PaymentMethod.COURTESY,
        PaymentMethod.PACKAGE,
        PaymentMethod.SUBSCRIPTION,
    ]),
    amountBrl: z.number().nonnegative().multipleOf(0.01).optional().openapi({
        description: 'Amount in BRL. Defaults to the appointment procedure price when applicable.',
    }),
    status: z.nativeEnum(AppointmentPaymentStatus).optional(),
    insurancePlanId: entityId(InsurancePlanId).nullish(),
    insuranceAuthCode: z.string().max(100).nullish(),
    /** Required when paymentMethod = PACKAGE — the package credit to debit. */
    patientPackageId: entityId(PatientPackageId).nullish(),
    /** Required when paymentMethod = SUBSCRIPTION — the subscription whose monthly quota is consumed. */
    patientSubscriptionId: entityId(PatientSubscriptionId).nullish(),
    notes: z.string().max(1000).nullish(),
    /**
     * Partes já recebidas (ex.: Pix + cartão). Só para formas que movem dinheiro. A soma não pode
     * passar do valor; o pagamento fica pago quando a soma alcança o valor.
     */
    parts: receiptPartsSchema.optional(),
});

export class RegisterPaymentDto extends createZodDto(registerPaymentSchema) {}
