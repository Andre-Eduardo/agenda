import {DefectChangedEvent} from './defect-changed.event';
import {DefectCreatedEvent} from './defect-created.event';
import {DefectDeletedEvent} from './defect-deleted.event';
import {DefectFinishedEvent} from './defect-finished.event';

export * from './defect-changed.event';
export * from './defect-created.event';
export * from './defect-deleted.event';
export * from './defect-finished.event';

export const defectEvents = [DefectCreatedEvent, DefectChangedEvent, DefectDeletedEvent, DefectFinishedEvent];
