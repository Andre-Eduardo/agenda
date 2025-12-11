import type {PersonId} from '@domain/person/entities';
import type {Patient} from './entities';

export interface PatientRepository {
    findById(id: PersonId): Promise<Patient | null>;
    delete(id: PersonId): Promise<void>;
}
export abstract class PatientRepository {}
