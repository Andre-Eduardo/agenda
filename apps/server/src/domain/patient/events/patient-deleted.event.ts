import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Patient } from "@domain/patient/entities";

export class PatientDeletedEvent extends DomainEvent {
  static readonly type = "PATIENT_DELETED";
  readonly patient: Patient;

  constructor(props: DomainEventProps<PatientDeletedEvent>) {
    super(PatientDeletedEvent.type, props.timestamp);
    this.patient = props.patient;
  }
}
