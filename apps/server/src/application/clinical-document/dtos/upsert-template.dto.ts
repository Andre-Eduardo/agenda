import { z } from "zod";
import { ClinicalDocumentType } from "@domain/clinical-document/entities";
import { createZodDto } from "@application/@shared/validation/dto";

export const upsertTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  layoutJson: z.record(z.string(), z.unknown()),
});

export class UpsertTemplateDto extends createZodDto(upsertTemplateSchema) {}

export const templateTypeParamSchema = z.object({
  clinicId: z.string().uuid(),
  type: z.nativeEnum(ClinicalDocumentType),
});
