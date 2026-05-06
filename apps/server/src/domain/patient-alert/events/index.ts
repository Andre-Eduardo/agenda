import {PatientAlertChangedEvent} from '@domain/patient-alert/events/patient-alert-changed.event';
import {PatientAlertCreatedEvent} from '@domain/patient-alert/events/patient-alert-created.event';
import {PatientAlertDeletedEvent} from '@domain/patient-alert/events/patient-alert-deleted.event';

export * from '@domain/patient-alert/events/patient-alert-changed.event';
export * from '@domain/patient-alert/events/patient-alert-created.event';
export * from '@domain/patient-alert/events/patient-alert-deleted.event';

export const patientAlertEvents = [PatientAlertCreatedEvent, PatientAlertChangedEvent, PatientAlertDeletedEvent];
