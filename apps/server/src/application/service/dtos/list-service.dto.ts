import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {ServiceSortOptions} from '../../../domain/service/service.repository';
import {ServiceCategoryId} from '../../../domain/service-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listServiceSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(ServiceCategoryId).optional().openapi({description: 'The category to search for'}),
    name: z.string().min(1).optional().openapi({example: 'The name to search for'}),
    code: z.number().int().positive().optional().openapi({description: 'The code to search for'}),
    price: z.number().nonnegative().optional().openapi({description: 'The price to search for'}),
    pagination: pagination(<ServiceSortOptions>['name', 'code', 'price', 'createdAt', 'updatedAt']),
});

export class ListServiceDto extends createZodDto(listServiceSchema) {}
