import { PaginatedList, Pagination } from '../@shared/repository';
import type {Professional, ProfessionalId} from './entities';

export type ProfessionalSearchFilter = {
    ids?: ProfessionalId[];
    term?: string;
};

export type ProfessionalSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface ProfessionalRepository {
    findById(id: ProfessionalId): Promise<Professional | null>;
    
    delete(id: ProfessionalId): Promise<void>;

    search(
        pagination: Pagination<ProfessionalSortOptions>,
        filter?: ProfessionalSearchFilter
    ): Promise<PaginatedList<Professional>>;

    save(professional: Professional): Promise<void>;
}

export abstract class ProfessionalRepository {}
