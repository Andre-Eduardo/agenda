import { ClinicCreatedEvent } from "@domain/clinic/events/clinic-created.event";
import { ClinicChangedEvent } from "@domain/clinic/events/clinic-changed.event";
import { ClinicDeletedEvent } from "@domain/clinic/events/clinic-deleted.event";

export * from "@domain/clinic/events/clinic-changed.event";
export * from "@domain/clinic/events/clinic-created.event";
export * from "@domain/clinic/events/clinic-deleted.event";

export const clinicEvents = [ClinicCreatedEvent, ClinicChangedEvent, ClinicDeletedEvent];
