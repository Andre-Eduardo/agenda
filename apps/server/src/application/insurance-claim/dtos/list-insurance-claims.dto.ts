import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';

export const listInsuranceClaimsSchema = z.object({
    claimStatus: z
        .union([z.nativeEnum(InsuranceClaimStatus), z.array(z.nativeEnum(InsuranceClaimStatus))])
        .transform((v) => (Array.isArray(v) ? v : [v]))
        .optional()
        .openapi({description: 'Filter by claim status'}),
});

export class ListInsuranceClaimsDto extends createZodDto(listInsuranceClaimsSchema) {}
