import {z} from 'zod';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, username} from '../../@shared/validation/schemas';

const signInSchema = z.object({
    professionalId: entityId(ProfessionalId).nullish(),
    username,
    password: z.string().min(1).openapi({example: 'J0hn@d03'}),
});

export class SignInDto extends createZodDto(signInSchema) {}
