import {z} from 'zod';
import {ProfessionalId} from '../../../domain/professional/entities';
import {Specialty} from '../../../domain/form-template/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const createFormTemplateInputSchema = z.object({
    code: z
        .string()
        .min(3)
        .max(100)
        .regex(/^[a-z0-9_]+$/, 'Code must be lowercase alphanumeric with underscores')
        .openapi({example: 'psico_anamnese_inicial'}),
    name: z.string().min(1).max(255).openapi({example: 'Anamnese Inicial'}),
    description: z.string().max(1000).nullish().openapi({example: 'Formulário de anamnese para primeira consulta'}),
    specialty: z.nativeEnum(Specialty).openapi({example: Specialty.PSICOLOGIA}),
    isPublic: z.boolean().default(false).openapi({description: 'Public templates are available to all professionals'}),
    professionalId: entityId(ProfessionalId).nullish(),
});

export class CreateFormTemplateInputDto extends createZodDto(createFormTemplateInputSchema) {}

export const createFormTemplateSchema = createFormTemplateInputSchema;
export type CreateFormTemplateDto = z.infer<typeof createFormTemplateSchema>;
