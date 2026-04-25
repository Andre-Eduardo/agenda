import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {DocumentPermission} from '../entities';

export class DocumentPermissionGrantedEvent extends DomainEvent {
    static readonly type = 'DOCUMENT_PERMISSION_GRANTED';
    readonly permission: DocumentPermission;

    constructor(props: DomainEventProps<DocumentPermissionGrantedEvent>) {
        super(DocumentPermissionGrantedEvent.type, props.timestamp);
        this.permission = props.permission;
    }
}
