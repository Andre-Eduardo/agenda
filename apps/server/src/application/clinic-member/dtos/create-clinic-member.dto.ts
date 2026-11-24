import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {ClinicMemberRole} from '@domain/clinic-member/entities';

const createClinicMemberInputSchema = z.object({
    userId: z.string().uuid(),
    /** A member may hold more than one role at once (e.g. OWNER + PROFESSIONAL). */
    roles: z.array(z.nativeEnum(ClinicMemberRole)).min(1),
    displayName: z.string().nullish(),
    color: z.string().nullish(),
    /**
     * Confirma a cobrança extra quando o novo profissional passa do incluído no plano.
     * Sem isso a API responde 409 EXTRA_SEAT_CONFIRMATION_REQUIRED.
     */
    acceptExtraCharge: z.boolean().default(false),
});

export class CreateClinicMemberInputDto extends createZodDto(createClinicMemberInputSchema) {}

export const createClinicMemberSchema = createClinicMemberInputSchema.extend({
    clinicId: z.string().uuid(),
});

export class CreateClinicMemberDto extends createZodDto(createClinicMemberSchema) {}
