import { DocumentPermissionGrantedEvent } from "@domain/document-permission/events/document-permission-granted.event";
import { DocumentPermissionChangedEvent } from "@domain/document-permission/events/document-permission-changed.event";

export * from "@domain/document-permission/events/document-permission-changed.event";
export * from "@domain/document-permission/events/document-permission-granted.event";

export const documentPermissionEvents = [
  DocumentPermissionGrantedEvent,
  DocumentPermissionChangedEvent,
];
