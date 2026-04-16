import { PaginatedList, Pagination } from '../@shared/repository';
import type {PersonId} from '../person/entities';
import type {ProfessionalId} from '../professional/entities';
import type {Patient, PatientId} from './entities';

export type PatientSearchFilter = {
    ids?: PatientId[];
    term?: string;
    professionalId?: ProfessionalId;
};

export type PatientSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface PatientRepository {
    findById(id: PersonId, professionalId?: ProfessionalId): Promise<Patient | null>;

    delete(id: PersonId): Promise<void>;

    search(
        pagination: Pagination<PatientSortOptions>,
        filter?: PatientSearchFilter
    ): Promise<PaginatedList<Patient>>;

    save(patient: Patient): Promise<void>;
}

export abstract class PatientRepository {}
