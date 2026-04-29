import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Patient } from "@domain/patient/entities";

export class PatientCreatedEvent extends DomainEvent {
  static readonly type = "PATIENT_CREATED";
  readonly patient: Patient;

  constructor(props: DomainEventProps<PatientCreatedEvent>) {
    super(PatientCreatedEvent.type, props.timestamp);
    this.patient = props.patient;
  }
}
