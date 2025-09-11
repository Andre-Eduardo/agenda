import {z} from 'zod';
import type {CompanySortOptions} from '../../../domain/company/company.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {pagination} from '../../@shared/validation/schemas';

const listCompanySchema = z.object({
    name: z.string().optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<CompanySortOptions>['name', 'createdAt', 'updatedAt']),
});

export class ListCompanyDto extends createZodDto(listCompanySchema) {}
