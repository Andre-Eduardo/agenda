import type {ClinicId} from '@domain/clinic/entities';
import type {PatientSubscriptionPlan, PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';

export interface PatientSubscriptionPlanRepository {
    findById(id: PatientSubscriptionPlanId): Promise<PatientSubscriptionPlan | null>;

    findByClinicId(clinicId: ClinicId): Promise<PatientSubscriptionPlan[]>;

    save(plan: PatientSubscriptionPlan): Promise<void>;
}

export abstract class PatientSubscriptionPlanRepository {}
