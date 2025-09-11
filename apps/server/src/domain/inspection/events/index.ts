import {InspectionFinishedEvent} from './inspection-finished.event';
import {InspectionStartedEvent} from './inspection-started.event';

export * from './inspection-finished.event';
export * from './inspection-started.event';

export const inspectionEvents = [InspectionStartedEvent, InspectionFinishedEvent];
