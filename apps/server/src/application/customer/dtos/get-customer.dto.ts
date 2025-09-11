import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getCustomerSchema = z.object({
    id: entityId(PersonId),
});

export class GetCustomerDto extends createZodDto(getCustomerSchema) {}
