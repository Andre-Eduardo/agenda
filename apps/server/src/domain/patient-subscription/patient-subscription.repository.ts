import type {PatientSubscription, PatientSubscriptionId} from '@domain/patient-subscription/entities';
import type {PatientId} from '@domain/patient/entities';

export interface PatientSubscriptionRepository {
    findById(id: PatientSubscriptionId): Promise<PatientSubscription | null>;

    findByPatientId(patientId: PatientId): Promise<PatientSubscription[]>;

    findActiveByPatientId(patientId: PatientId): Promise<PatientSubscription | null>;

    /** ACTIVE subscriptions whose currentPeriodEnd has passed — used by the monthly renewal job. */
    findRenewable(now: Date): Promise<PatientSubscription[]>;

    save(subscription: PatientSubscription): Promise<void>;
}

export abstract class PatientSubscriptionRepository {}
