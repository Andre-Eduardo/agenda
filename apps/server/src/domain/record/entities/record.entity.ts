import type {PersonId} from '@domain/person/entities';
import {
    AggregateRoot,
    type AllEntityProps,
    type EntityJson,
    type EntityProps,
    type CreateEntity,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ProfessionalId} from '../../professional/entities';
import {RecordCreatedEvent, RecordChangedEvent, RecordDeletedEvent} from '../events';
import type {File} from './file.entity';

export type RecordProps = EntityProps<Record>;
export type CreateRecord = CreateEntity<Record>;
export type UpdateRecord = Partial<RecordProps>;

export class Record extends AggregateRoot<RecordId> {
    patientId: PersonId;
    professionalId: ProfessionalId;
    description: string;
    files: File[];

    constructor(props: AllEntityProps<Record>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.description = props.description;
        this.files = props.files;
        this.validate();
    }

    static create(props: CreateRecord): Record {
        const now = new Date();

        const record = new Record({
            ...props,
            id: RecordId.generate(),
            patientId: props.patientId,
            professionalId: props.professionalId,
            description: props.description,
            files: props.files,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        record.addEvent(new RecordCreatedEvent({record, timestamp: now}));

        return record;
    }

    delete(): void {
        this.addEvent(new RecordDeletedEvent({record: this}));
    }

    change(props: UpdateRecord): void {
        const oldState = new Record(this);

        if (props.description !== undefined) {
            this.description = props.description;
        }

        this.validate();

        this.addEvent(new RecordChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Validation
    }

    toJSON(): EntityJson<Record> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            description: this.description,
            files: this.files.map((f) => f.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class RecordId extends EntityId<'RecordId'> {
    static from(value: string): RecordId {
        return new RecordId(value);
    }

    static generate(): RecordId {
        return new RecordId();
    }
}
