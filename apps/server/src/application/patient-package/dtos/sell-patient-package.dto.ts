import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {PackagePlanId} from '@domain/package-plan/entities';
import {PatientId} from '@domain/patient/entities';

/** How the package itself was paid — never PACKAGE/SUBSCRIPTION/INSURANCE (those are for sessions). */
export const packagePaymentMethodSchema = z.enum([
    'CASH',
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'COURTESY',
]);

export const sellPatientPackageInputSchema = z.object({
    packagePlanId: entityId(PackagePlanId),
    paymentMethod: packagePaymentMethodSchema,
    paidAt: datetime.nullish(),
    notes: z.string().max(1000).nullish(),
});

export class SellPatientPackageInputDto extends createZodDto(sellPatientPackageInputSchema) {}

export const sellPatientPackageSchema = sellPatientPackageInputSchema.extend({
    patientId: entityId(PatientId),
});

export type SellPatientPackageDto = z.infer<typeof sellPatientPackageSchema>;
