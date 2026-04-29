import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Professional } from "@domain/professional/entities";

export class ProfessionalDeletedEvent extends DomainEvent {
  static readonly type = "PROFESSIONAL_DELETED";
  readonly professional: Professional;

  constructor(props: DomainEventProps<ProfessionalDeletedEvent>) {
    super(ProfessionalDeletedEvent.type, props.timestamp);
    this.professional = props.professional;
  }
}
