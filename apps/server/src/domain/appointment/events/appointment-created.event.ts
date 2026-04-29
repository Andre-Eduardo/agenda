import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Appointment } from "@domain/appointment/entities";

export class AppointmentCreatedEvent extends DomainEvent {
  static readonly type = "APPOINTMENT_CREATED";
  readonly appointment: Appointment;

  constructor(props: DomainEventProps<AppointmentCreatedEvent>) {
    super(AppointmentCreatedEvent.type, props.timestamp);
    this.appointment = props.appointment;
  }
}
