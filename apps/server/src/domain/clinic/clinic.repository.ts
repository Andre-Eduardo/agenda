import type { Clinic, ClinicId } from "@domain/clinic/entities";

export interface ClinicRepository {
  findById(id: ClinicId): Promise<Clinic | null>;
  findAllActive(): Promise<Clinic[]>;
  save(clinic: Clinic): Promise<void>;
}

export abstract class ClinicRepository {}
