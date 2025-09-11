import type {EmployeeSortOptions} from '../../../domain/employee/employee.repository';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {listPersonSchema} from '../../person/dtos';

const listEmployeeSchema = listPersonSchema.extend({
    positionId: entityId(EmployeePositionId).optional().openapi({description: 'The employee position to search for'}),
    pagination: pagination(<EmployeeSortOptions>[
        'name',
        'companyName',
        'personType',
        'gender',
        'createdAt',
        'updatedAt',
    ]),
});

export class ListEmployeeDto extends createZodDto(listEmployeeSchema) {}
