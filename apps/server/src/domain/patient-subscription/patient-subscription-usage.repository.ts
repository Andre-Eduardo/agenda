import type {
    PatientSubscriptionId,
    PatientSubscriptionUsage,
    PatientSubscriptionUsageId,
} from '@domain/patient-subscription/entities';

export type ConsumeAppointmentResult = {appointmentsUsed: number} | null;

export interface PatientSubscriptionUsageRepository {
    findCurrentPeriod(
        patientSubscriptionId: PatientSubscriptionId,
        periodYear: number,
        periodMonth: number
    ): Promise<PatientSubscriptionUsage | null>;

    findByPatientSubscriptionId(patientSubscriptionId: PatientSubscriptionId): Promise<PatientSubscriptionUsage[]>;

    save(usage: PatientSubscriptionUsage): Promise<void>;

    /** Atomically increments appointmentsUsed (WHERE appointmentsUsed < quotaSnapshot). Null = quota exhausted. */
    consumeAppointment(id: PatientSubscriptionUsageId): Promise<ConsumeAppointmentResult>;

    /** Atomically decrements appointmentsUsed, floored at zero. */
    refundAppointment(id: PatientSubscriptionUsageId): Promise<{appointmentsUsed: number}>;
}

export abstract class PatientSubscriptionUsageRepository {}
