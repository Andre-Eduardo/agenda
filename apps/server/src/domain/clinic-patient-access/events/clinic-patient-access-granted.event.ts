import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicPatientAccess } from "@domain/clinic-patient-access/entities";

export class ClinicPatientAccessGrantedEvent extends DomainEvent {
  static readonly type = "CLINIC_PATIENT_ACCESS_GRANTED";
  readonly access: ClinicPatientAccess;

  constructor(props: DomainEventProps<ClinicPatientAccessGrantedEvent>) {
    super(ClinicPatientAccessGrantedEvent.type, props.timestamp);
    this.access = props.access;
  }
}
