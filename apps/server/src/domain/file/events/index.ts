import { FileReadyEvent } from "@domain/file/events/file-ready.event";
import { FileUploadedEvent } from "@domain/file/events/file-uploaded.event";

export * from "@domain/file/events/file-ready.event";
export * from "@domain/file/events/file-uploaded.event";

export const fileEvents = [FileUploadedEvent, FileReadyEvent];
