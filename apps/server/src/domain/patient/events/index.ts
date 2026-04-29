import { PatientChangedEvent } from "@domain/patient/events/patient-changed.event";
import { PatientCreatedEvent } from "@domain/patient/events/patient-created.event";
import { PatientDeletedEvent } from "@domain/patient/events/patient-deleted.event";

export * from "@domain/patient/events/patient-changed.event";
export * from "@domain/patient/events/patient-created.event";
export * from "@domain/patient/events/patient-deleted.event";

export const patientEvents = [PatientCreatedEvent, PatientChangedEvent, PatientDeletedEvent];
