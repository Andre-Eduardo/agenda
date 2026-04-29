import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

export const changePaymentPlanSchema = z.object({
  planCode: z.enum(["STARTER", "CONSULTORIO", "CLINICA", "ESPECIALISTA"]),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BOLETO"]).optional().default("PIX"),
});

export class ChangePaymentPlanDto extends createZodDto(changePaymentPlanSchema) {}
