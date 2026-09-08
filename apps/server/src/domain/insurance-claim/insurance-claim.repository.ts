import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {InsuranceClaim, InsuranceClaimId, InsuranceClaimStatus} from '@domain/insurance-claim/entities';

export type InsuranceClaimSearchFilter = {
    clinicId: ClinicId;
    claimStatus?: InsuranceClaimStatus[];
};

export interface InsuranceClaimRepository {
    findById(id: InsuranceClaimId): Promise<InsuranceClaim | null>;

    findByAppointmentPaymentId(appointmentPaymentId: AppointmentPaymentId): Promise<InsuranceClaim | null>;

    search(filter: InsuranceClaimSearchFilter): Promise<InsuranceClaim[]>;

    save(claim: InsuranceClaim): Promise<void>;
}

export abstract class InsuranceClaimRepository {}
