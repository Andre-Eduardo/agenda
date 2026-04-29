import type { TupleToUnion } from "type-fest";
import { appointmentEvents } from "@domain/appointment/events";
import { appointmentPaymentEvents } from "@domain/appointment-payment/events";
import { clinicEvents } from "@domain/clinic/events";
import { clinicMemberEvents } from "@domain/clinic-member/events";
import { clinicPatientAccessEvents } from "@domain/clinic-patient-access/events";
import { clinicalProfileEvents } from "@domain/clinical-profile/events";
import { clinicalDocumentEvents } from "@domain/clinical-document/events";
import { documentPermissionEvents } from "@domain/document-permission/events";
import { draftEvolutionEvents } from "@domain/draft-evolution/events";
import { fileEvents } from "@domain/file/events";
import { patientAlertEvents } from "@domain/patient-alert/events";
import { patientEvents } from "@domain/patient/events";
import { patientFormEvents } from "@domain/patient-form/events";
import { personEvents } from "@domain/person/events";
import { professionalEvents } from "@domain/professional/events";
import { recordEvents } from "@domain/record/events";
import { subscriptionEvents } from "@domain/subscription/events";
import { userEvents } from "@domain/user/events";

export const eventTypes = [
  userEvents,
  professionalEvents,
  appointmentEvents,
  appointmentPaymentEvents,
  recordEvents,
  patientEvents,
  personEvents,
  fileEvents,
  clinicalProfileEvents,
  clinicalDocumentEvents,
  patientAlertEvents,
  patientFormEvents,
  clinicEvents,
  clinicMemberEvents,
  clinicPatientAccessEvents,
  documentPermissionEvents,
  draftEvolutionEvents,
  subscriptionEvents,
];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]["type"];
