import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {EmployeePositionSortOptions} from '../../../domain/employee-position/employee-position.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listEmployeePositionDto = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<EmployeePositionSortOptions>['name', 'createdAt', 'updatedAt']),
});

export class ListEmployeePositionDto extends createZodDto(listEmployeePositionDto) {}
