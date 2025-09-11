import {DeepCleaningFinishedEvent} from './deep-cleaning-finished.event';
import {DeepCleaningStartedEvent} from './deep-cleaning-started.event';

export * from './deep-cleaning-finished.event';
export * from './deep-cleaning-started.event';

export const deepCleaningEvents = [DeepCleaningStartedEvent, DeepCleaningFinishedEvent];
