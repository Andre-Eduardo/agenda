import { z } from "zod";
import { ClinicId } from "@domain/clinic/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const createInsurancePlanSchema = z.object({
  /** Tenant boundary — injected from cookie via RequestContextMiddleware. */
  clinicId: entityId(ClinicId).nullish(),
  name: z.string().min(1).max(255).openapi({ example: "Unimed" }),
  code: z.string().nullish().openapi({ example: "UNI-001" }),
});

export class CreateInsurancePlanDto extends createZodDto(createInsurancePlanSchema) {}
