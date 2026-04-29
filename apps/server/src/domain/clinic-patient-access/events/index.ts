import { ClinicPatientAccessGrantedEvent } from "@domain/clinic-patient-access/events/clinic-patient-access-granted.event";
import { ClinicPatientAccessChangedEvent } from "@domain/clinic-patient-access/events/clinic-patient-access-changed.event";
import { ClinicPatientAccessRevokedEvent } from "@domain/clinic-patient-access/events/clinic-patient-access-revoked.event";

export * from "@domain/clinic-patient-access/events/clinic-patient-access-changed.event";
export * from "@domain/clinic-patient-access/events/clinic-patient-access-granted.event";
export * from "@domain/clinic-patient-access/events/clinic-patient-access-revoked.event";

export const clinicPatientAccessEvents = [
  ClinicPatientAccessGrantedEvent,
  ClinicPatientAccessChangedEvent,
  ClinicPatientAccessRevokedEvent,
];
