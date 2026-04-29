import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { PatientFormId } from "@domain/patient-form/entities";
import type { PatientId } from "@domain/patient/entities";

export class PatientFormCompletedEvent extends DomainEvent {
  static readonly type = "PATIENT_FORM_COMPLETED";
  readonly formId: PatientFormId;
  readonly patientId: PatientId;

  constructor(props: DomainEventProps<PatientFormCompletedEvent>) {
    super(PatientFormCompletedEvent.type, props.timestamp);
    this.formId = props.formId;
    this.patientId = props.patientId;
  }
}
