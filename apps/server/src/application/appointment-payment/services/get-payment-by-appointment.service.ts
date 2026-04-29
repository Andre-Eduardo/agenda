import { Injectable } from "@nestjs/common";
import { PreconditionException, ResourceNotFoundException } from "@domain/@shared/exceptions";
import { AppointmentRepository } from "@domain/appointment/appointment.repository";
import { AppointmentPaymentRepository } from "@domain/appointment-payment/appointment-payment.repository";
import { AppointmentId } from "@domain/appointment/entities";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { AppointmentPaymentDto } from "@application/appointment-payment/dtos";

export type GetPaymentByAppointmentCommand = { appointmentId: AppointmentId };

@Injectable()
export class GetPaymentByAppointmentService implements ApplicationService<
  GetPaymentByAppointmentCommand,
  AppointmentPaymentDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
  ) {}

  async execute({
    actor,
    payload,
  }: Command<GetPaymentByAppointmentCommand>): Promise<AppointmentPaymentDto> {
    const { appointmentId } = payload;

    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (appointment === null) {
      throw new ResourceNotFoundException("Appointment not found.", appointmentId.toString());
    }

    if (!appointment.clinicId.equals(actor.clinicId)) {
      throw new PreconditionException("Appointment does not belong to the current clinic.");
    }

    const payment = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

    if (payment === null) {
      throw new ResourceNotFoundException(
        "Payment not found for this appointment.",
        appointmentId.toString(),
      );
    }

    return new AppointmentPaymentDto(payment);
  }
}
