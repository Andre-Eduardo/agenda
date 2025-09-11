import {z} from 'zod';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteServiceCategorySchema = z.object({
    id: entityId(ServiceCategoryId),
});

export class DeleteServiceCategoryDto extends createZodDto(deleteServiceCategorySchema) {}
