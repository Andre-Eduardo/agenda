import { RecordChangedEvent } from "@domain/record/events/record-changed.event";
import { RecordCreatedEvent } from "@domain/record/events/record-created.event";
import { RecordDeletedEvent } from "@domain/record/events/record-deleted.event";
import { RecordSavedEvent } from "@domain/record/events/record-saved.event";
import { RecordSignedEvent } from "@domain/record/events/record-signed.event";
import { RecordReopenedEvent } from "@domain/record/events/record-reopened.event";

export * from "@domain/record/events/record-changed.event";
export * from "@domain/record/events/record-created.event";
export * from "@domain/record/events/record-deleted.event";
export * from "@domain/record/events/record-reopened.event";
export * from "@domain/record/events/record-saved.event";
export * from "@domain/record/events/record-signed.event";

export const recordEvents = [
  RecordCreatedEvent,
  RecordChangedEvent,
  RecordDeletedEvent,
  RecordSavedEvent,
  RecordSignedEvent,
  RecordReopenedEvent,
];
