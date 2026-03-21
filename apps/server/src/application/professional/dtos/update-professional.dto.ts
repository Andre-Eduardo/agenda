import {z} from 'zod';
import {ProfessionalId} from '../../../domain/professional/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const updateProfessionalInputSchema = z.object({
    specialty: z.string().min(1).optional().openapi({example: 'Neurology'}),
    userId: entityId(UserId).nullish(),
});

export class UpdateProfessionalInputDto extends createZodDto(updateProfessionalInputSchema) {}

export const updateProfessionalSchema = updateProfessionalInputSchema.extend({
    id: entityId(ProfessionalId),
});

export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;
