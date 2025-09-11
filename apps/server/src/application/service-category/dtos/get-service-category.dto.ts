import {z} from 'zod';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getServiceCategorySchema = z.object({
    id: entityId(ServiceCategoryId),
});

export class GetServiceCategoryDto extends createZodDto(getServiceCategorySchema) {}
