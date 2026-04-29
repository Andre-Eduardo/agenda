import {
  AggregateRoot,
  type AllEntityProps,
  type CreateEntity,
  type EntityJson,
  type EntityProps,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { RecordId } from "@domain/record/entities/record.entity";

export type RecordAmendmentProps = EntityProps<RecordAmendment>;
export type CreateRecordAmendment = CreateEntity<RecordAmendment>;

export class RecordAmendment extends AggregateRoot<RecordAmendmentId> {
  clinicId: ClinicId;
  recordId: RecordId;
  requestedByMemberId: ClinicMemberId;
  justification: string;
  reopenedAt: Date;
  relockedAt: Date | null;

  constructor(props: AllEntityProps<RecordAmendment>) {
    super(props);
    this.clinicId = props.clinicId;
    this.recordId = props.recordId;
    this.requestedByMemberId = props.requestedByMemberId;
    this.justification = props.justification;
    this.reopenedAt = props.reopenedAt;
    this.relockedAt = props.relockedAt ?? null;
  }

  static create(props: CreateRecordAmendment): RecordAmendment {
    const now = new Date();

    return new RecordAmendment({
      ...props,
      id: RecordAmendmentId.generate(),
      reopenedAt: now,
      relockedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  toJSON(): EntityJson<RecordAmendment> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      recordId: this.recordId.toJSON(),
      requestedByMemberId: this.requestedByMemberId.toJSON(),
      justification: this.justification,
      reopenedAt: this.reopenedAt.toJSON(),
      relockedAt: this.relockedAt?.toJSON() ?? null,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
    };
  }
}

export class RecordAmendmentId extends EntityId<"RecordAmendmentId"> {
  static from(value: string): RecordAmendmentId {
    return new RecordAmendmentId(value);
  }

  static generate(): RecordAmendmentId {
    return new RecordAmendmentId();
  }
}
