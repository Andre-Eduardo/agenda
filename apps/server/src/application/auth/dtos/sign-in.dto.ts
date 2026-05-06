import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId, username} from '@application/@shared/validation/schemas';
import {ClinicMemberId} from '@domain/clinic-member/entities';

const signInSchema = z.object({
    clinicMemberId: entityId(ClinicMemberId).nullish(),
    username,
    password: z.string().min(1).openapi({example: 'J0hn@d03'}),
});

export class SignInDto extends createZodDto(signInSchema) {}
