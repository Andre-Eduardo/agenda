import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { PatientAlert } from "@domain/patient-alert/entities";

export class PatientAlertCreatedEvent extends DomainEvent {
  static readonly type = "PATIENT_ALERT_CREATED";
  readonly alert: PatientAlert;

  constructor(props: DomainEventProps<PatientAlertCreatedEvent>) {
    super(PatientAlertCreatedEvent.type, props.timestamp);
    this.alert = props.alert;
  }
}
