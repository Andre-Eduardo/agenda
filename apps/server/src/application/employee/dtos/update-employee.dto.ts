import type {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createNewEmployeeSchema} from './create-employee.dto';

const updateEmployeeInputSchema = createNewEmployeeSchema.omit({companyId: true}).partial();

export class UpdateEmployeeInputDto extends createZodDto(updateEmployeeInputSchema) {}

export const updateEmployeeSchema = updateEmployeeInputSchema.extend({
    id: entityId(PersonId),
});

export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
