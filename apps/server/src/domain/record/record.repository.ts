import { PaginatedList, Pagination } from '../@shared/repository';
import type {Record, RecordId} from './entities';

export type RecordSearchFilter = {
    ids?: RecordId[];
    term?: string;
};

export type RecordSortOptions = [
    'createdAt',
    'updatedAt',
];

export interface RecordRepository {
    findById(id: RecordId): Promise<Record | null>;
    
    delete(id: RecordId): Promise<void>;

    search(
        pagination: Pagination<RecordSortOptions>,
        filter?: RecordSearchFilter
    ): Promise<PaginatedList<Record>>;

    save(record: Record): Promise<void>;
}

export abstract class RecordRepository {}
