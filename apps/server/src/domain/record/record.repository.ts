import {Record, RecordId} from './entities';

export interface RecordRepository {
    findById(id: RecordId): Promise<Record | null>;
    delete(id: RecordId): Promise<void>;
}

export abstract class RecordRepository {}
