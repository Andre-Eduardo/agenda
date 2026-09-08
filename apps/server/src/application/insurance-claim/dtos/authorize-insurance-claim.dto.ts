import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {InsuranceClaimId} from '@domain/insurance-claim/entities';

export const authorizeInsuranceClaimInputSchema = z.object({
    authorizationCode: z.string().min(1).openapi({example: 'AUTH-2026-000123'}),
});

export class AuthorizeInsuranceClaimInputDto extends createZodDto(authorizeInsuranceClaimInputSchema) {}

export const authorizeInsuranceClaimSchema = authorizeInsuranceClaimInputSchema.extend({
    id: entityId(InsuranceClaimId),
});

export type AuthorizeInsuranceClaimDto = z.infer<typeof authorizeInsuranceClaimSchema>;
