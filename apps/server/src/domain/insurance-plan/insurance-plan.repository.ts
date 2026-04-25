import type {ClinicId} from '../clinic/entities';
import type {InsurancePlan, InsurancePlanId} from './entities';

export interface InsurancePlanRepository {
    findById(id: InsurancePlanId): Promise<InsurancePlan | null>;
    findByClinicId(clinicId: ClinicId): Promise<InsurancePlan[]>;
    save(plan: InsurancePlan): Promise<void>;
}

export abstract class InsurancePlanRepository {}
