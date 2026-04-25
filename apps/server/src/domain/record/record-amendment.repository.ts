import type {RecordAmendment, RecordAmendmentId} from './entities/record-amendment.entity';
import type {RecordId} from './entities/record.entity';

export interface RecordAmendmentRepository {
    findAllByRecordId(recordId: RecordId): Promise<RecordAmendment[]>;
    save(amendment: RecordAmendment): Promise<void>;
}

export abstract class RecordAmendmentRepository {}
