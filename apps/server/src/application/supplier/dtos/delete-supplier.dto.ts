import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteSupplierSchema = z.object({
    id: entityId(PersonId),
});

export class DeleteSupplierDto extends createZodDto(deleteSupplierSchema) {}
