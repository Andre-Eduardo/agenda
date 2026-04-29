import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { DocumentPermission } from "@domain/document-permission/entities";

export class DocumentPermissionGrantedEvent extends DomainEvent {
  static readonly type = "DOCUMENT_PERMISSION_GRANTED";
  readonly permission: DocumentPermission;

  constructor(props: DomainEventProps<DocumentPermissionGrantedEvent>) {
    super(DocumentPermissionGrantedEvent.type, props.timestamp);
    this.permission = props.permission;
  }
}
