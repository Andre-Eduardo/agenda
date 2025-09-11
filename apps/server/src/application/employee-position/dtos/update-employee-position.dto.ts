import type {z} from 'zod';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createEmployeePositionSchema} from './create-employee-position.dto';

const updateEmployeePositionInputSchema = createEmployeePositionSchema.omit({companyId: true}).partial();

export class UpdateEmployeePositionInputDto extends createZodDto(updateEmployeePositionInputSchema) {}

export const updateEmployeePositionSchema = updateEmployeePositionInputSchema.extend({
    id: entityId(EmployeePositionId),
});

export type UpdateEmployeePositionDto = z.infer<typeof updateEmployeePositionSchema>;
