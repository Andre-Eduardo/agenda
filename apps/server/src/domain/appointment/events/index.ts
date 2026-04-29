import { AppointmentChangedEvent } from "@domain/appointment/events/appointment-changed.event";
import { AppointmentCreatedEvent } from "@domain/appointment/events/appointment-created.event";
import { AppointmentDeletedEvent } from "@domain/appointment/events/appointment-deleted.event";
import { AppointmentCheckinEvent } from "@domain/appointment/events/appointment-checkin.event";
import { AppointmentCalledEvent } from "@domain/appointment/events/appointment-called.event";

export * from "@domain/appointment/events/appointment-called.event";
export * from "@domain/appointment/events/appointment-changed.event";
export * from "@domain/appointment/events/appointment-checkin.event";
export * from "@domain/appointment/events/appointment-created.event";
export * from "@domain/appointment/events/appointment-deleted.event";

export const appointmentEvents = [
  AppointmentCreatedEvent,
  AppointmentChangedEvent,
  AppointmentDeletedEvent,
  AppointmentCheckinEvent,
  AppointmentCalledEvent,
];
