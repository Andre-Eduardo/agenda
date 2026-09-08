import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {InsuranceClaimId} from '@domain/insurance-claim/entities';

export const registerGlosaInputSchema = z.object({
    reason: z.string().min(1).openapi({example: 'Procedimento fora da cobertura contratada'}),
    glosaAmountBrl: z.coerce.number().nonnegative(),
    approvedAmountBrl: z.coerce.number().nonnegative(),
});

export class RegisterGlosaInputDto extends createZodDto(registerGlosaInputSchema) {}

export const registerGlosaSchema = registerGlosaInputSchema.extend({
    id: entityId(InsuranceClaimId),
});

export type RegisterGlosaDto = z.infer<typeof registerGlosaSchema>;
