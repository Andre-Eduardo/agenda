import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UploadFile} from '../entities';

export class FileReadyEvent extends DomainEvent {
    static readonly type = 'FILE_READY';
    readonly file: UploadFile;

    constructor(props: DomainEventProps<FileReadyEvent>) {
        super(FileReadyEvent.type, props.timestamp);
        this.file = props.file;
    }
}
