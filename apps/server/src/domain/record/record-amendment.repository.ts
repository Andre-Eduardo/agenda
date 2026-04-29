import type { RecordAmendment } from "@domain/record/entities/record-amendment.entity";
import type { RecordId } from "@domain/record/entities/record.entity";

export interface RecordAmendmentRepository {
  findAllByRecordId(recordId: RecordId): Promise<RecordAmendment[]>;
  save(amendment: RecordAmendment): Promise<void>;
}

export abstract class RecordAmendmentRepository {}
