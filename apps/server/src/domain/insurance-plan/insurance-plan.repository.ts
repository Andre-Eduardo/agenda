import type { ClinicId } from "@domain/clinic/entities";
import type { InsurancePlan, InsurancePlanId } from "@domain/insurance-plan/entities";

export interface InsurancePlanRepository {
  findById(id: InsurancePlanId): Promise<InsurancePlan | null>;
  findByClinicId(clinicId: ClinicId): Promise<InsurancePlan[]>;
  save(plan: InsurancePlan): Promise<void>;
}

export abstract class InsurancePlanRepository {}
