import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { PatientAlert } from "@domain/patient-alert/entities";

export class PatientAlertChangedEvent extends DomainEvent {
  static readonly type = "PATIENT_ALERT_CHANGED";
  readonly oldState: PatientAlert;
  readonly newState: PatientAlert;

  constructor(props: DomainEventProps<PatientAlertChangedEvent>) {
    super(PatientAlertChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
