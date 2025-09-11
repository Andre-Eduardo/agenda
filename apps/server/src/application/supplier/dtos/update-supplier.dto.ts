import type {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createNewSupplierSchema} from './create-supplier.dto';

const updateSupplierInputSchema = createNewSupplierSchema.omit({companyId: true}).partial();

export class UpdateSupplierInputDto extends createZodDto(updateSupplierInputSchema) {}

export const updateSupplierSchema = updateSupplierInputSchema.extend({
    id: entityId(PersonId),
});

export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
