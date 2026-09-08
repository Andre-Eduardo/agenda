import type {PatientPackage, PatientPackageId} from '@domain/patient-package/entities';
import type {PatientId} from '@domain/patient/entities';

export type ConsumeCreditResult = {remainingCredits: number} | null;

export interface PatientPackageRepository {
    findById(id: PatientPackageId): Promise<PatientPackage | null>;

    findByPatientId(patientId: PatientId): Promise<PatientPackage[]>;

    /** ACTIVE packages past their expiresAt — used by the daily expiration job. */
    findExpirable(now: Date): Promise<PatientPackage[]>;

    save(patientPackage: PatientPackage): Promise<void>;

    /**
     * Atomically decrements remainingCredits by 1 (WHERE remainingCredits > 0 AND status = ACTIVE),
     * flipping status to DEPLETED when it reaches zero. Returns null if no row matched (no credits
     * left / not active) — the caller must treat that as a precondition failure, not retry.
     */
    consumeCredit(id: PatientPackageId): Promise<ConsumeCreditResult>;

    /**
     * Atomically increments remainingCredits by 1, reactivating a DEPLETED package to ACTIVE.
     * Returns the new balance.
     */
    refundCredit(id: PatientPackageId): Promise<{remainingCredits: number}>;
}

export abstract class PatientPackageRepository {}
