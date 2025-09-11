import {z} from 'zod';
import {PersonId} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getEmployeeSchema = z.object({
    id: entityId(PersonId),
});

export class GetEmployeeDto extends createZodDto(getEmployeeSchema) {}
