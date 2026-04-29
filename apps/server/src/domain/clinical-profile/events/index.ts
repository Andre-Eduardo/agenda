import { ClinicalProfileCreatedEvent } from "@domain/clinical-profile/events/clinical-profile-created.event";
import { ClinicalProfileChangedEvent } from "@domain/clinical-profile/events/clinical-profile-changed.event";

export * from "@domain/clinical-profile/events/clinical-profile-changed.event";
export * from "@domain/clinical-profile/events/clinical-profile-created.event";

export const clinicalProfileEvents = [ClinicalProfileCreatedEvent, ClinicalProfileChangedEvent];
