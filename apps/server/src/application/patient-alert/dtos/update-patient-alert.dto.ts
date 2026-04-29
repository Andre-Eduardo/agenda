import { z } from "zod";
import { PatientAlertId, AlertSeverity } from "@domain/patient-alert/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

const updatePatientAlertInputSchema = z.object({
  title: z.string().min(1).max(255).optional().openapi({ example: "Updated alert title" }),
  description: z.string().nullish().openapi({ example: "Updated description" }),
  severity: z.nativeEnum(AlertSeverity).optional(),
  isActive: z.boolean().optional(),
});

export class UpdatePatientAlertInputDto extends createZodDto(updatePatientAlertInputSchema) {}

export const updatePatientAlertSchema = updatePatientAlertInputSchema.extend({
  alertId: entityId(PatientAlertId),
});

export type UpdatePatientAlertDto = z.infer<typeof updatePatientAlertSchema>;
