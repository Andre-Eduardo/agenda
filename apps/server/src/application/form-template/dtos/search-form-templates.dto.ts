import {z} from 'zod';
import {Specialty} from '../../../domain/form-template/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas/pagination.schema';

export const searchFormTemplatesSchema = z
    .object({
        specialty: z.nativeEnum(Specialty).optional(),
        /**
         * `public` → only system templates (clinicId = null)
         * `mine` → only the actor's current clinic
         * `all` → public + actor's clinic
         */
        scope: z.enum(['public', 'mine', 'all']).optional().default('all'),
    })
    .merge(pagination(['createdAt', 'updatedAt', 'name']));

export class SearchFormTemplatesDto extends createZodDto(searchFormTemplatesSchema) {}

export const formTemplateParamSchema = z.object({
    templateId: z.string().openapi({format: 'uuid'}),
});

export const formTemplateVersionParamSchema = z.object({
    versionId: z.string().openapi({format: 'uuid'}),
});
