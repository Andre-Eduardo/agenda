import { Injectable } from "@nestjs/common";
import {
  InvalidInputException,
  PreconditionException,
  ResourceNotFoundException,
} from "@domain/@shared/exceptions";
import { AppointmentRepository } from "@domain/appointment/appointment.repository";
import { AppointmentId, AppointmentStatus } from "@domain/appointment/entities";
import { AppointmentPaymentRepository } from "@domain/appointment-payment/appointment-payment.repository";
import {
  AppointmentPayment,
  AppointmentPaymentStatus,
  PaymentMethod,
} from "@domain/appointment-payment/entities";
import { PatientRepository } from "@domain/patient/patient.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { AppointmentPaymentDto, RegisterPaymentDto } from "@application/appointment-payment/dtos";

export type RegisterPaymentCommand = RegisterPaymentDto & { appointmentId: AppointmentId };

@Injectable()
export class RegisterPaymentService implements ApplicationService<
  RegisterPaymentCommand,
  AppointmentPaymentDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
    private readonly patientRepository: PatientRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({
    actor,
    payload,
  }: Command<RegisterPaymentCommand>): Promise<AppointmentPaymentDto> {
    const {
      appointmentId,
      paymentMethod,
      amountBrl,
      status,
      insurancePlanId,
      insuranceAuthCode,
      notes,
    } = payload;

    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (appointment === null) {
      throw new ResourceNotFoundException("Appointment not found.", appointmentId.toString());
    }

    if (!appointment.clinicId.equals(actor.clinicId)) {
      throw new PreconditionException("Appointment does not belong to the current clinic.");
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new PreconditionException("Cannot register payment for a cancelled appointment.");
    }

    const existing = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

    if (existing !== null) {
      throw new PreconditionException("Payment already registered for this appointment.");
    }

    if (paymentMethod === PaymentMethod.INSURANCE && !insurancePlanId) {
      throw new InvalidInputException(
        "insurancePlanId is required when paymentMethod is INSURANCE",
        [{ field: "insurancePlanId", reason: "Required when paymentMethod is INSURANCE" }],
      );
    }

    const resolvedStatus = status ?? AppointmentPaymentStatus.PAID;
    const paidAt = resolvedStatus === AppointmentPaymentStatus.PAID ? new Date() : null;

    const payment = AppointmentPayment.create({
      clinicId: actor.clinicId,
      appointmentId,
      patientId: appointment.patientId,
      registeredByMemberId: actor.clinicMemberId,
      paymentMethod,
      status: resolvedStatus,
      amountBrl,
      paidAt,
      insurancePlanId: insurancePlanId ?? null,
      insuranceAuthCode: insuranceAuthCode ?? null,
      notes: notes ?? null,
    });

    await this.appointmentPaymentRepository.save(payment);
    this.eventDispatcher.dispatch(actor, payment);

    return new AppointmentPaymentDto(payment);
  }
}
