import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Clinic } from "@domain/clinic/entities";

export class ClinicDeletedEvent extends DomainEvent {
  static readonly type = "CLINIC_DELETED";
  readonly clinic: Clinic;

  constructor(props: DomainEventProps<ClinicDeletedEvent>) {
    super(ClinicDeletedEvent.type, props.timestamp);
    this.clinic = props.clinic;
  }
}
