import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Appointment } from "@domain/appointment/entities";

export class AppointmentCheckinEvent extends DomainEvent {
  static readonly type = "APPOINTMENT_CHECKIN";
  readonly appointment: Appointment;

  constructor(props: DomainEventProps<AppointmentCheckinEvent>) {
    super(AppointmentCheckinEvent.type, props.timestamp);
    this.appointment = props.appointment;
  }
}
