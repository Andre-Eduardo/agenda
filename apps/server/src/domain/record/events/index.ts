import { RecordChangedEvent } from './record-changed.event';
import { RecordCreatedEvent } from './record-created.event';
import { RecordDeletedEvent } from './record-deleted.event';

export * from './record-created.event';
export * from './record-changed.event';
export * from './record-deleted.event';

export const recordEvents = [
    RecordCreatedEvent,
    RecordChangedEvent,
    RecordDeletedEvent,
];