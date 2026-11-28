import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import type {Actor} from '@domain/@shared/actor';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import type {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import type {AppointmentPayment} from '@domain/appointment-payment/entities';
import type {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {Appointment, AppointmentId} from '@domain/appointment/entities';

/** Carrega a consulta e o pagamento dela, conferindo que são da clínica do ator. */
export async function loadAppointmentPayment(
    repositories: {appointments: AppointmentRepository; payments: AppointmentPaymentRepository},
    actor: Actor,
    appointmentId: AppointmentId
): Promise<{appointment: Appointment; payment: AppointmentPayment}> {
    const appointment = await repositories.appointments.findById(appointmentId);

    if (appointment === null) {
        throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
    }

    assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

    const payment = await repositories.payments.findByAppointmentId(appointmentId);

    if (payment === null) {
        throw new ResourceNotFoundException('Payment not found for this appointment.', appointmentId.toString());
    }

    return {appointment, payment};
}
