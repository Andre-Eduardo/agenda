import {z} from 'zod';
import {Specialty} from '../../../domain/form-template/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {pagination} from '../../@shared/validation/schemas/pagination.schema';
import {ProfessionalId} from '../../../domain/professional/entities';

export const searchFormTemplatesSchema = z
    .object({
        specialty: z.nativeEnum(Specialty).optional(),
        scope: z.enum(['public', 'mine', 'all']).optional().default('all'),
        professionalId: entityId(ProfessionalId).optional(),
    })
    .merge(pagination(['createdAt', 'updatedAt', 'name']));

export class SearchFormTemplatesDto extends createZodDto(searchFormTemplatesSchema) {}

export const formTemplateParamSchema = z.object({
    templateId: z.string().openapi({format: 'uuid'}),
});

export const formTemplateVersionParamSchema = z.object({
    versionId: z.string().openapi({format: 'uuid'}),
});
