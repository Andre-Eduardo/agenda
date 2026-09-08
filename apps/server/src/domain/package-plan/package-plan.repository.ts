import type {ClinicId} from '@domain/clinic/entities';
import type {PackagePlan, PackagePlanId} from '@domain/package-plan/entities';

export interface PackagePlanRepository {
    findById(id: PackagePlanId): Promise<PackagePlan | null>;

    findByClinicId(clinicId: ClinicId): Promise<PackagePlan[]>;

    save(plan: PackagePlan): Promise<void>;
}

export abstract class PackagePlanRepository {}
