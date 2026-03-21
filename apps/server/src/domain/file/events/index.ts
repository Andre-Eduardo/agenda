import {FileReadyEvent} from './file-ready.event';
import {FileUploadedEvent} from './file-uploaded.event';

export * from './file-ready.event';
export * from './file-uploaded.event';

export const fileEvents = [FileUploadedEvent, FileReadyEvent];
