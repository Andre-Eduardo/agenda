import { z } from "zod";
import { PatientId } from "@domain/patient/entities";
import { AlertSeverity } from "@domain/patient-alert/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

const createPatientAlertInputSchema = z.object({
  title: z.string().min(1).max(255).openapi({ example: "Penicillin allergy — severe reaction" }),
  description: z
    .string()
    .nullish()
    .openapi({ example: "Patient had anaphylaxis in 2018 — carry epipen" }),
  severity: z.nativeEnum(AlertSeverity).default(AlertSeverity.MEDIUM),
  isActive: z.boolean().default(true),
});

export class CreatePatientAlertInputDto extends createZodDto(createPatientAlertInputSchema) {}

export const createPatientAlertSchema = createPatientAlertInputSchema.extend({
  patientId: entityId(PatientId),
});

export type CreatePatientAlertDto = z.infer<typeof createPatientAlertSchema>;
