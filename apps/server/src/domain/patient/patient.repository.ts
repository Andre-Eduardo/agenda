import type {ClinicId} from '../clinic/entities';
import { PaginatedList, Pagination } from '../@shared/repository';
import type {PersonId} from '../person/entities';
import type {Patient, PatientId} from './entities';

export type PatientSearchFilter = {
    ids?: PatientId[];
    term?: string;
    clinicId?: ClinicId;
};

export type PatientSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface PatientRepository {
    findById(id: PersonId, clinicId?: ClinicId): Promise<Patient | null>;

    delete(id: PersonId): Promise<void>;

    search(
        pagination: Pagination<PatientSortOptions>,
        filter?: PatientSearchFilter
    ): Promise<PaginatedList<Patient>>;

    save(patient: Patient): Promise<void>;
}

export abstract class PatientRepository {}
