import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {ProductSortOptions} from '../../../domain/product/product.repository';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listProductSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(ProductCategoryId).optional().openapi({description: 'The category to search for'}),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    code: z.number().int().positive().optional().openapi({description: 'The code to search for'}),
    price: z.number().positive().optional().openapi({description: 'The price to search for'}),
    pagination: pagination(<ProductSortOptions>['name', 'code', 'price', 'createdAt', 'updatedAt']),
});

export class ListProductDto extends createZodDto(listProductSchema) {}
