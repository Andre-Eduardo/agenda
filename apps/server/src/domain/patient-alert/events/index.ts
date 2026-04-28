import {PatientAlertCreatedEvent} from './patient-alert-created.event';
import {PatientAlertChangedEvent} from './patient-alert-changed.event';
import {PatientAlertDeletedEvent} from './patient-alert-deleted.event';

export * from './patient-alert-changed.event';
export * from './patient-alert-created.event';
export * from './patient-alert-deleted.event';

export const patientAlertEvents = [PatientAlertCreatedEvent, PatientAlertChangedEvent, PatientAlertDeletedEvent];
