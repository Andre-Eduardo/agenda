import type {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createNewCustomerSchema} from './create-customer.dto';

const updateCustomerInputSchema = createNewCustomerSchema.omit({companyId: true}).partial();

export class UpdateCustomerInputDto extends createZodDto(updateCustomerInputSchema) {}

export const updateCustomerSchema = updateCustomerInputSchema.extend({
    id: entityId(PersonId),
});

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
