import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Professional } from "@domain/professional/entities";

export class ProfessionalCreatedEvent extends DomainEvent {
  static readonly type = "PROFESSIONAL_CREATED";
  readonly professional: Professional;

  constructor(props: DomainEventProps<ProfessionalCreatedEvent>) {
    super(ProfessionalCreatedEvent.type, props.timestamp);
    this.professional = props.professional;
  }
}
