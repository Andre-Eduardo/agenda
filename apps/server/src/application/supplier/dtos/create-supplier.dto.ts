import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createPersonSchema} from '../../person/dtos';

export const createNewSupplierSchema = createPersonSchema.openapi({
    description: 'Create a new supplier with the given data',
});

export class CreateNewSupplierDto extends createZodDto(createNewSupplierSchema) {}

export const createSupplierFromIdSchema = z
    .object({
        id: entityId(PersonId),
    })
    .openapi({
        description: 'Create a new supplier using the data from an existing person',
    });

export class CreateSupplierFromIdDto extends createZodDto(createSupplierFromIdSchema) {}

export const createSupplierSchema = z.union([createNewSupplierSchema, createSupplierFromIdSchema]);

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
