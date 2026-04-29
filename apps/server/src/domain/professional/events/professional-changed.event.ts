import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Professional } from "@domain/professional/entities";

export class ProfessionalChangedEvent extends DomainEvent {
  static readonly type = "PROFESSIONAL_CHANGED";
  readonly oldState: Professional;
  readonly newState: Professional;

  constructor(props: DomainEventProps<ProfessionalChangedEvent>) {
    super(ProfessionalChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
