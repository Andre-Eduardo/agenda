import {CleaningFinishedEvent} from './cleaning-finished.event';
import {CleaningStartedEvent} from './cleaning-started.event';

export * from './cleaning-finished.event';
export * from './cleaning-started.event';

export const cleaningEvents = [CleaningStartedEvent, CleaningFinishedEvent];
