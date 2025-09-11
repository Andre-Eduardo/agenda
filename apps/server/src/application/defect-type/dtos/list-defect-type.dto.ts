import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {DefectTypeSortOptions} from '../../../domain/defect-type/defect-type.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listDefectTypeSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<DefectTypeSortOptions>['name', 'createdAt', 'updatedAt']),
});

export class ListDefectTypeDto extends createZodDto(listDefectTypeSchema) {}
