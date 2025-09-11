import {z} from 'zod';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getEmployeePositionSchema = z.object({
    id: entityId(EmployeePositionId),
});

export class GetEmployeePositionDto extends createZodDto(getEmployeePositionSchema) {}
