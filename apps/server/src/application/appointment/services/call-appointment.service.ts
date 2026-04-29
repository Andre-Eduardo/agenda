import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { AppointmentRepository } from "@domain/appointment/appointment.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { AppointmentDto, CallAppointmentDto } from "@application/appointment/dtos";

@Injectable()
export class CallAppointmentService implements ApplicationService<
  CallAppointmentDto,
  AppointmentDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload: { id } }: Command<CallAppointmentDto>): Promise<AppointmentDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (appointment === null) {
      throw new ResourceNotFoundException("Appointment not found.", id.toString());
    }

    appointment.call();

    await this.appointmentRepository.save(appointment);

    this.eventDispatcher.dispatch(actor, appointment);

    return new AppointmentDto(appointment);
  }
}
