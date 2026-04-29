import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Clinic } from "@domain/clinic/entities";

export class ClinicCreatedEvent extends DomainEvent {
  static readonly type = "CLINIC_CREATED";
  readonly clinic: Clinic;

  constructor(props: DomainEventProps<ClinicCreatedEvent>) {
    super(ClinicCreatedEvent.type, props.timestamp);
    this.clinic = props.clinic;
  }
}
