import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { Appointment } from "@domain/appointment/entities";

export class AppointmentChangedEvent extends DomainEvent {
  static readonly type = "APPOINTMENT_CHANGED";
  readonly oldState: Appointment;
  readonly newState: Appointment;

  constructor(props: DomainEventProps<AppointmentChangedEvent>) {
    super(AppointmentChangedEvent.type, props.timestamp);
    this.oldState = props.oldState;
    this.newState = props.newState;
  }
}
