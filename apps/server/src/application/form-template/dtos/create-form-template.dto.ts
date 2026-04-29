import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

const createFormTemplateInputSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores")
    .openapi({ example: "psico_anamnese_inicial" }),
  name: z.string().min(1).max(255).openapi({ example: "Anamnese Inicial" }),
  description: z
    .string()
    .max(1000)
    .nullish()
    .openapi({ example: "Formulário de anamnese para primeira consulta" }),
  specialty: z.string().min(1).max(100).openapi({ example: "PSICOLOGIA" }),
  /**
   * Public templates have null clinicId (system-wide). Private templates are
   * scoped to the actor's current clinic via the request-context middleware.
   */
  isPublic: z.boolean().default(false),
});

export class CreateFormTemplateInputDto extends createZodDto(createFormTemplateInputSchema) {}

export const createFormTemplateSchema = createFormTemplateInputSchema;
export type CreateFormTemplateDto = z.infer<typeof createFormTemplateSchema>;
