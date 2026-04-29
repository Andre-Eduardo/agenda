import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Clinic } from "@domain/clinic/entities";

export class ClinicChangedEvent extends DomainEvent {
  static readonly type = "CLINIC_CHANGED";
  readonly oldState: Clinic;
  readonly newState: Clinic;

  constructor(props: DomainEventProps<ClinicChangedEvent>) {
    super(ClinicChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
