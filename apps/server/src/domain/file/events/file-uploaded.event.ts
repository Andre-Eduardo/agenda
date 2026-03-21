import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UploadFile} from '../entities';

export class FileUploadedEvent extends DomainEvent {
    static readonly type = 'FILE_UPLOADED';
    readonly file: UploadFile;

    constructor(props: DomainEventProps<FileUploadedEvent>) {
        super(FileUploadedEvent.type, props.timestamp);
        this.file = props.file;
    }
}
