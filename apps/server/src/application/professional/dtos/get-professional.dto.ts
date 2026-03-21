import {z} from 'zod';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getProfessionalSchema = z.object({
    id: entityId(ProfessionalId),
});

export class GetProfessionalDto extends createZodDto(getProfessionalSchema) {}
