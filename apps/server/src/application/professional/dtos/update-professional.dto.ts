import { z } from "zod";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { ProfessionalId } from "@domain/professional/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

const updateProfessionalInputSchema = z.object({
  registrationNumber: z.string().nullish().openapi({ example: "CRM-SP 12345" }),
  specialty: z.string().nullish().openapi({ example: "Neurology" }),
  specialtyNormalized: z.nativeEnum(AiSpecialtyGroup).nullish(),
});

export class UpdateProfessionalInputDto extends createZodDto(updateProfessionalInputSchema) {}

export const updateProfessionalSchema = updateProfessionalInputSchema.extend({
  id: entityId(ProfessionalId),
});

export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;
