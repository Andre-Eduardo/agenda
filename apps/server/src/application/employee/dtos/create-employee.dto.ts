import {z} from 'zod';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, password, username} from '../../@shared/validation/schemas';
import {createPersonSchema} from '../../person/dtos';

const newEmployeeSchema = z.object({
    positionId: entityId(EmployeePositionId),
    allowSystemAccess: z.boolean(),
    username: username.nullish(),
    password: password.nullish(),
});

export const createNewEmployeeSchema = createPersonSchema.merge(newEmployeeSchema).openapi({
    description: 'Create a new employee with the given data',
});

export class CreateNewEmployeeDto extends createZodDto(createNewEmployeeSchema) {}

export const createEmployeeFromIdSchema = z
    .object({
        id: entityId(PersonId),
    })
    .merge(newEmployeeSchema)
    .openapi({
        description: 'Create a new employee using the data from an existing person',
    });

export class CreateEmployeeFromIdDto extends createZodDto(createEmployeeFromIdSchema) {}

export const createEmployeeSchema = z.union([createNewEmployeeSchema, createEmployeeFromIdSchema]);

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
