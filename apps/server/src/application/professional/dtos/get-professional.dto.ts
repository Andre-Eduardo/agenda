import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {ProfessionalId} from '@domain/professional/entities';

export const getProfessionalSchema = z.object({
    id: entityId(ProfessionalId),
});

export class GetProfessionalDto extends createZodDto(getProfessionalSchema) {}
