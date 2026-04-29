import { z } from "zod";
import { AppointmentPaymentStatus } from "@domain/appointment-payment/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { datetime } from "@application/@shared/validation/schemas";

export const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentPaymentStatus),
  paidAt: datetime.nullish(),
  amountBrl: z.number().positive().optional(),
  notes: z.string().max(1000).nullish(),
});

export class UpdatePaymentStatusDto extends createZodDto(updatePaymentStatusSchema) {}
