import {DocumentPermissionGrantedEvent} from './document-permission-granted.event';
import {DocumentPermissionChangedEvent} from './document-permission-changed.event';

export * from './document-permission-changed.event';
export * from './document-permission-granted.event';

export const documentPermissionEvents = [DocumentPermissionGrantedEvent, DocumentPermissionChangedEvent];
