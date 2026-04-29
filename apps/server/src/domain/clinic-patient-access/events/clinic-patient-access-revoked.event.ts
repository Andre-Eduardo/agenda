import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { ClinicPatientAccess } from "@domain/clinic-patient-access/entities";

export class ClinicPatientAccessRevokedEvent extends DomainEvent {
  static readonly type = "CLINIC_PATIENT_ACCESS_REVOKED";
  readonly access: ClinicPatientAccess;

  constructor(props: DomainEventProps<ClinicPatientAccessRevokedEvent>) {
    super(ClinicPatientAccessRevokedEvent.type, props.timestamp);
    this.access = props.access;
  }
}
