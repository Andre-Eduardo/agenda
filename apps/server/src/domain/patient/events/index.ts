import { PatientCreatedEvent } from './patient-created.event';
import { PatientChangedEvent } from './patient-changed.event';
import { PatientDeletedEvent } from './patient-deleted.event';

export * from './patient-created.event';
export * from './patient-changed.event';
export * from './patient-deleted.event';

export const patientEvents = [
    PatientCreatedEvent,
    PatientChangedEvent,
    PatientDeletedEvent,
];