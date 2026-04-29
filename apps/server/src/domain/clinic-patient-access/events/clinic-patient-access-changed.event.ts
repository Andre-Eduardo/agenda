import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicPatientAccess } from "@domain/clinic-patient-access/entities";

export class ClinicPatientAccessChangedEvent extends DomainEvent {
  static readonly type = "CLINIC_PATIENT_ACCESS_CHANGED";
  readonly oldState: ClinicPatientAccess;
  readonly newState: ClinicPatientAccess;

  constructor(props: DomainEventProps<ClinicPatientAccessChangedEvent>) {
    super(ClinicPatientAccessChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
