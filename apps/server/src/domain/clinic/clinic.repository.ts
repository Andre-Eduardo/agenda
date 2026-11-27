import type {PaginatedList, Pagination} from '@domain/@shared/repository';
import type {Clinic, ClinicAccountType, ClinicId} from '@domain/clinic/entities';

export type ClinicSearchFilter = {
    term?: string;
    accountType?: ClinicAccountType;
};

export type ClinicSortOptions = ['name', 'createdAt'];

export interface ClinicRepository {
    findById(id: ClinicId): Promise<Clinic | null>;
    findAllActive(): Promise<Clinic[]>;

    /** Platform admin listing (e.g. the AI module management panel) — every clinic, paginated. */
    search(pagination: Pagination<ClinicSortOptions>, filter?: ClinicSearchFilter): Promise<PaginatedList<Clinic>>;

    save(clinic: Clinic): Promise<void>;
}

export abstract class ClinicRepository {}
