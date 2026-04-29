import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { EventType } from "@domain/event/event.type";
import type { ProfessionalId } from "@domain/professional/entities";

export abstract class ProfessionalDomainEvent extends DomainEvent {
  readonly professionalId: ProfessionalId;

  protected constructor(type: EventType, props: DomainEventProps<ProfessionalDomainEvent>) {
    super(type, props.timestamp);
    this.professionalId = props.professionalId;
  }
}
