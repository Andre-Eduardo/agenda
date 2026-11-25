import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException} from '@domain/@shared/exceptions';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {RecordId} from '@domain/record/entities/record.entity';

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
        const justification = props.justification.trim();

        if (justification.length === 0 || justification.length > 2000) {
            throw new InvalidInputException('record.invalid_reopen_reason');
        }

        const now = props.reopenedAt;

        return new RecordAmendment({
            ...props,
            id: RecordAmendmentId.generate(),
            justification,
            relockedAt: null,
            createdAt: now,
            updatedAt: now,
        });
    }

    relock(signedAt: Date): void {
        this.relockedAt = signedAt;
        this.update(signedAt);
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

export class RecordAmendmentId extends EntityId<'RecordAmendmentId'> {
    static from(value: string): RecordAmendmentId {
        return new RecordAmendmentId(value);
    }

    static generate(): RecordAmendmentId {
        return new RecordAmendmentId();
    }
}
