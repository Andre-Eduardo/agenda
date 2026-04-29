import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { PatientAlert } from "@domain/patient-alert/entities";

export class PatientAlertDeletedEvent extends DomainEvent {
  static readonly type = "PATIENT_ALERT_DELETED";
  readonly alert: PatientAlert;

  constructor(props: DomainEventProps<PatientAlertDeletedEvent>) {
    super(PatientAlertDeletedEvent.type, props.timestamp);
    this.alert = props.alert;
  }
}
