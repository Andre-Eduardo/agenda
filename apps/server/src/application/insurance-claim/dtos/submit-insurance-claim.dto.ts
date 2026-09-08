import {z} from 'zod';
import {entityId} from '@application/@shared/validation/schemas';
import {InsuranceClaimId} from '@domain/insurance-claim/entities';

export const submitInsuranceClaimSchema = z.object({
    id: entityId(InsuranceClaimId),
});

export type SubmitInsuranceClaimDto = z.infer<typeof submitInsuranceClaimSchema>;
