import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PatientId} from '../../patient/entities';
import {ProfessionalId} from '../../professional/entities';
import {File} from './file.entity';

export type RecordProps = EntityProps<Record>;
export type UpdateRecord = Partial<RecordProps>;

export class Record extends AggregateRoot<RecordId> {
    patientId: PatientId;
    professionalId: ProfessionalId;
    description: string;
    files: File[];

    constructor(props: AllEntityProps<Record>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.description = props.description;
        this.files = props.files;
    }

    toJSON(): EntityJson<Record> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            description: this.description,
            files: this.files.map(f => f.toJSON()),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected change(props: UpdateRecord): void {
        if (props.description !== undefined) {
            this.description = props.description;
        }
    }

    protected validate(): void {
        // Validation
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
