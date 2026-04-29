import { ClinicalDocumentGeneratedEvent } from "@domain/clinical-document/events/clinical-document-generated.event";

export * from "@domain/clinical-document/events/clinical-document-generated.event";

export const clinicalDocumentEvents = [ClinicalDocumentGeneratedEvent] as const;
