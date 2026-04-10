import {ClinicalProfileCreatedEvent} from './clinical-profile-created.event';
import {ClinicalProfileChangedEvent} from './clinical-profile-changed.event';

export * from './clinical-profile-created.event';
export * from './clinical-profile-changed.event';

export const clinicalProfileEvents = [ClinicalProfileCreatedEvent, ClinicalProfileChangedEvent];
