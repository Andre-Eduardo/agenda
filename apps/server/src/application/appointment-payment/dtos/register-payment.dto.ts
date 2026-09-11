import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientPackageId} from '@domain/patient-package/entities';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities';

export const registerPaymentSchema = z.object({
    paymentMethod: z.nativeEnum(PaymentMethod),
    amountBrl: z.number().positive(),
    status: z.nativeEnum(AppointmentPaymentStatus).optional().default(AppointmentPaymentStatus.PAID),
    insurancePlanId: entityId(InsurancePlanId).nullish(),
    insuranceAuthCode: z.string().max(100).nullish(),
    /** Required when paymentMethod = PACKAGE — the package credit to debit. */
    patientPackageId: entityId(PatientPackageId).nullish(),
    /** Required when paymentMethod = SUBSCRIPTION — the subscription whose monthly quota is consumed. */
    patientSubscriptionId: entityId(PatientSubscriptionId).nullish(),
    notes: z.string().max(1000).nullish(),
});

export class RegisterPaymentDto extends createZodDto(registerPaymentSchema) {}
