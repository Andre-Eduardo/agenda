import {Entity, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {PatientId} from '../../patient/entities';
import type {RecordId} from './record.entity';

export type FileProps = EntityProps<File>;
export type UpdateFile = Partial<FileProps>;

export class File extends Entity<FileId> {
    recordId: RecordId | null;
    patientId: PatientId | null;
    fileName: string;
    url: string;
    description: string;

    constructor(props: AllEntityProps<File>) {
        super(props);
        this.recordId = props.recordId ?? null;
        this.patientId = props.patientId ?? null;
        this.fileName = props.fileName;
        this.url = props.url;
        this.description = props.description;
    }

    toJSON(): EntityJson<File> {
        return {
            id: this.id.toJSON(),
            recordId: this.recordId?.toJSON() ?? null,
            patientId: this.patientId?.toJSON() ?? null,
            fileName: this.fileName,
            url: this.url,
            description: this.description,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }

    protected change(props: UpdateFile): void {
        if (props.fileName !== undefined) {
            this.fileName = props.fileName;
        }

        if (props.url !== undefined) {
            this.url = props.url;
        }

        if (props.description !== undefined) {
            this.description = props.description;
        }
    }

    protected validate(): void {
        // Validation logic
    }
}

export class FileId extends EntityId<'FileId'> {
    static from(value: string): FileId {
        return new FileId(value);
    }

    static generate(): FileId {
        return new FileId();
    }
}
