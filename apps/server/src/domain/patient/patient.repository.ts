
import {Patient, PatientId} from './entities';

export interface PatientRepository {
    findById(id: PatientId): Promise<Patient | null>;
    delete(id: PatientId): Promise<void>;
}

export abstract class PatientRepository {}
