import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const grantProfessionalAgendaAccessSchema = z.object({
    granteeMemberId: z.string().uuid(),
    reason: z.string().max(500).nullish(),
});

export class GrantProfessionalAgendaAccessDto extends createZodDto(grantProfessionalAgendaAccessSchema) {}
