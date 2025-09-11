import type {z} from 'zod';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createServiceCategorySchema} from './create-service-category.dto';

const updateServiceCategoryInputSchema = createServiceCategorySchema.omit({companyId: true}).partial();

export class UpdateServiceCategoryInputDto extends createZodDto(updateServiceCategoryInputSchema) {}

export const updateServiceCategorySchema = updateServiceCategoryInputSchema.extend({
    id: entityId(ServiceCategoryId),
});

export type UpdateServiceCategoryDto = z.infer<typeof updateServiceCategorySchema>;
