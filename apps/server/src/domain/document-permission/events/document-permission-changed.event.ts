import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { DocumentPermission } from "@domain/document-permission/entities";

export class DocumentPermissionChangedEvent extends DomainEvent {
  static readonly type = "DOCUMENT_PERMISSION_CHANGED";
  readonly oldState: DocumentPermission;
  readonly newState: DocumentPermission;

  constructor(props: DomainEventProps<DocumentPermissionChangedEvent>) {
    super(DocumentPermissionChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
