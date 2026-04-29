import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

export const activateSubscriptionSchema = z.object({
  planCode: z.enum(["STARTER", "CONSULTORIO", "CLINICA", "ESPECIALISTA"]),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BOLETO"]),
  cpfCnpj: z.string().optional(),
});

export class ActivateSubscriptionDto extends createZodDto(activateSubscriptionSchema) {}
