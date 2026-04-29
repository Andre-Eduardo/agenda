import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicalDocument } from "@domain/clinical-document/entities";

export class ClinicalDocumentGeneratedEvent extends DomainEvent {
  static readonly type = "CLINICAL_DOCUMENT_GENERATED";
  readonly document: ClinicalDocument;

  constructor(props: DomainEventProps<ClinicalDocumentGeneratedEvent>) {
    super(ClinicalDocumentGeneratedEvent.type, props.timestamp);
    this.document = props.document;
  }
}
