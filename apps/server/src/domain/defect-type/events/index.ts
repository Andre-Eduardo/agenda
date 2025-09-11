import {DefectTypeChangedEvent} from './defect-type-changed.event';
import {DefectTypeCreatedEvent} from './defect-type-created.event';
import {DefectTypeDeletedEvent} from './defect-type-deleted.event';

export * from './defect-type-changed.event';
export * from './defect-type-created.event';
export * from './defect-type-deleted.event';

export const defectTypeEvents = [DefectTypeChangedEvent, DefectTypeCreatedEvent, DefectTypeDeletedEvent];
