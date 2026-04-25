import {RecordChangedEvent} from './record-changed.event';
import {RecordCreatedEvent} from './record-created.event';
import {RecordDeletedEvent} from './record-deleted.event';
import {RecordSavedEvent} from './record-saved.event';
import {RecordSignedEvent} from './record-signed.event';
import {RecordReopenedEvent} from './record-reopened.event';

export * from './record-changed.event';
export * from './record-created.event';
export * from './record-deleted.event';
export * from './record-saved.event';
export * from './record-signed.event';
export * from './record-reopened.event';

export const recordEvents = [
    RecordCreatedEvent,
    RecordChangedEvent,
    RecordDeletedEvent,
    RecordSavedEvent,
    RecordSignedEvent,
    RecordReopenedEvent,
];
