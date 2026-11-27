import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {email, password, username} from '@application/@shared/validation/schemas';
import {AiSpecialtyGroup} from '@domain/form-template/entities';

export const onboardSoloSchema = z.object({
    name: z.string().min(1).max(255).openapi({example: 'Dra. Ana Souza'}),
    username,
    email,
    password,
    /** Nome do consultório. Padrão: "Consultório de <nome>". */
    clinicName: z.string().min(1).max(255).nullish(),
    phone: z.string().nullish(),
    /** Registro no conselho (CRM, CRP, CREFITO...). */
    registrationNumber: z.string().max(64).nullish().openapi({example: 'CRP 06/12345'}),
    specialty: z.string().max(255).nullish().openapi({example: 'Psicologia'}),
    specialtyNormalized: z.nativeEnum(AiSpecialtyGroup).nullish(),
    /** Aceite dos termos de uso e da política de privacidade. Obrigatório. */
    acceptTerms: z.literal(true),
    /** Exigido quando o servidor roda com SIGN_UP_SOLO_MODE=invite. */
    inviteCode: z.string().max(256).nullish(),
});

export class OnboardSoloDto extends createZodDto(onboardSoloSchema) {}
