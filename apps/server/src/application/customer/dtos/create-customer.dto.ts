import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createPersonSchema} from '../../person/dtos';

export const createNewCustomerSchema = createPersonSchema.openapi({
    description: 'Create a new customer with the given data',
});

export class CreateNewCustomerDto extends createZodDto(createNewCustomerSchema) {}

export const createCustomerFromIdSchema = z
    .object({
        id: entityId(PersonId),
    })
    .openapi({
        description: 'Create a new customer using the data from an existing person',
    });

export class CreateCustomerFromIdDto extends createZodDto(createCustomerFromIdSchema) {}

export const createCustomerSchema = z.union([createNewCustomerSchema, createCustomerFromIdSchema]);

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
