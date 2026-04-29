import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Appointment } from "@domain/appointment/entities";

export class AppointmentCalledEvent extends DomainEvent {
  static readonly type = "APPOINTMENT_CALLED";
  readonly appointment: Appointment;

  constructor(props: DomainEventProps<AppointmentCalledEvent>) {
    super(AppointmentCalledEvent.type, props.timestamp);
    this.appointment = props.appointment;
  }
}
