import {PaginatedList, Pagination} from '@domain/@shared/repository';
import type {ClinicId} from '@domain/clinic/entities';
import type {Patient, PatientId} from '@domain/patient/entities';
import type {PersonId} from '@domain/person/entities';

export type PatientSearchFilter = {
    ids?: PatientId[];
    term?: string;
    clinicId?: ClinicId;
};

export type PatientSortOptions = ['createdAt', 'updatedAt'];

export interface PatientRepository {
    findById(id: PersonId, clinicId?: ClinicId): Promise<Patient | null>;
    /** Nome de cada paciente (id → nome), sem carregar o cadastro. */
    findNamesByIds(clinicId: ClinicId, ids: PatientId[]): Promise<Map<string, string>>;

    delete(id: PersonId): Promise<void>;

    search(pagination: Pagination<PatientSortOptions>, filter?: PatientSearchFilter): Promise<PaginatedList<Patient>>;

    save(patient: Patient): Promise<void>;
}

export abstract class PatientRepository {}
