import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {ServiceCategorySortOptions} from '../../../domain/service-category/service-category.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listServiceCategorySchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<ServiceCategorySortOptions>['name', 'createdAt', 'updatedAt']),
});

export class ListServiceCategoryDto extends createZodDto(listServiceCategorySchema) {}
