import {z} from 'zod';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteEmployeePositionSchema = z.object({
    id: entityId(EmployeePositionId),
});

export class DeleteEmployeePositionDto extends createZodDto(deleteEmployeePositionSchema) {}
