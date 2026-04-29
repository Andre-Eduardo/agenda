import { z } from "zod";
import { InsurancePlanId } from "@domain/insurance-plan/entities";
import { AppointmentPaymentStatus, PaymentMethod } from "@domain/appointment-payment/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const registerPaymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  amountBrl: z.number().positive(),
  status: z.nativeEnum(AppointmentPaymentStatus).optional().default(AppointmentPaymentStatus.PAID),
  insurancePlanId: entityId(InsurancePlanId).nullish(),
  insuranceAuthCode: z.string().max(100).nullish(),
  notes: z.string().max(1000).nullish(),
});

export class RegisterPaymentDto extends createZodDto(registerPaymentSchema) {}
