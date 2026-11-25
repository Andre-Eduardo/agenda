import type {ClinicId} from '@domain/clinic/entities';
import type {RecordAmendment} from '@domain/record/entities/record-amendment.entity';
import type {RecordId} from '@domain/record/entities/record.entity';

export type RecordAmendmentEntry = {
    amendment: RecordAmendment;
    requestedByName: string | null;
};

export interface RecordAmendmentRepository {
    findAllByRecordId(recordId: RecordId, clinicId: ClinicId): Promise<RecordAmendmentEntry[]>;
    findLatestOpenByRecordId(recordId: RecordId, clinicId: ClinicId): Promise<RecordAmendment | null>;
    save(amendment: RecordAmendment): Promise<void>;
}

export abstract class RecordAmendmentRepository {}
