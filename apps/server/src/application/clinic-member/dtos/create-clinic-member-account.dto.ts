import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {email, password, username} from '@application/@shared/validation/schemas';
import {ClinicMemberRole} from '@domain/clinic-member/entities';

const createClinicMemberAccountSchema = z.object({
    name: z.string().min(1).openapi({example: 'Maria Silva'}),
    username,
    email,
    /** Temporary password; the member can change it later or use "forgot password". */
    password,
    roles: z.array(z.nativeEnum(ClinicMemberRole)).min(1),
    displayName: z.string().nullish(),
    color: z.string().nullish(),
    /** Same meaning as in POST /clinic-members/invite. */
    acceptExtraCharge: z.boolean().default(false),
});

export class CreateClinicMemberAccountDto extends createZodDto(createClinicMemberAccountSchema) {}
