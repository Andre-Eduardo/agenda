import type {Clinic, ClinicId} from './entities';

export interface ClinicRepository {
    findById(id: ClinicId): Promise<Clinic | null>;
    save(clinic: Clinic): Promise<void>;
}

export abstract class ClinicRepository {}
