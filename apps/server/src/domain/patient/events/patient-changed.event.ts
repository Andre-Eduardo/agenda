import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Patient } from "@domain/patient/entities";

export class PatientChangedEvent extends DomainEvent {
  static readonly type = "PATIENT_CHANGED";
  readonly oldState: Patient;
  readonly newState: Patient;

  constructor(props: DomainEventProps<PatientChangedEvent>) {
    super(PatientChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
