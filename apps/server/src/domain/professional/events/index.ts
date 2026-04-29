import { ProfessionalChangedEvent } from "@domain/professional/events/professional-changed.event";
import { ProfessionalCreatedEvent } from "@domain/professional/events/professional-created.event";
import { ProfessionalDeletedEvent } from "@domain/professional/events/professional-deleted.event";

export * from "@domain/professional/events/professional-changed.event";
export * from "@domain/professional/events/professional-created.event";
export * from "@domain/professional/events/professional-deleted.event";
export * from "@domain/professional/events/professional.domain.event";

export const professionalEvents = [
  ProfessionalCreatedEvent,
  ProfessionalChangedEvent,
  ProfessionalDeletedEvent,
];
