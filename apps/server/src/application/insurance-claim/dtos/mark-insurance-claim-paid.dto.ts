import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {InsuranceClaimId} from '@domain/insurance-claim/entities';

export const markInsuranceClaimPaidInputSchema = z.object({
    approvedAmountBrl: z.coerce.number().positive(),
});

export class MarkInsuranceClaimPaidInputDto extends createZodDto(markInsuranceClaimPaidInputSchema) {}

export const markInsuranceClaimPaidSchema = markInsuranceClaimPaidInputSchema.extend({
    id: entityId(InsuranceClaimId),
});

export type MarkInsuranceClaimPaidDto = z.infer<typeof markInsuranceClaimPaidSchema>;
