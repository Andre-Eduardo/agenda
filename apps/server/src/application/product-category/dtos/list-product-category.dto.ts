import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {ProductCategorySortOptions} from '../../../domain/product-category/product-category.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listProductCategorySchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<ProductCategorySortOptions>['name', 'createdAt', 'updatedAt']),
});

export class ListProductCategoryDto extends createZodDto(listProductCategorySchema) {}
