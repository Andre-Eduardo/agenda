import {mock} from 'jest-mock-extended';
import {GetAppointmentService} from '@application/appointment/services/get-appointment.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentType} from '@domain/appointment/entities';
import {Authorizer} from '@domain/auth/authorizer';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {UserId} from '@domain/user/entities';

const actor: Actor = {
    userId: UserId.generate(),
    clinicId: ClinicId.generate(),
    clinicMemberId: ClinicMemberId.generate(),
    ip: '127.0.0.1',
};

describe('critical resource tenant isolation', () => {
    it('returns access denied before reading payment details of another clinic appointment', async () => {
        const appointmentRepository = mock<AppointmentRepository>();
        const paymentRepository = mock<AppointmentPaymentRepository>();
        const appointment = Appointment.create({
            clinicId: ClinicId.generate(),
            patientId: PatientId.generate(),
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: ClinicMemberId.generate(),
            startAt: new Date('2030-01-01T09:00:00.000Z'),
            endAt: new Date('2030-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.RETURN,
            note: null,
            roomId: null,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        const service = new GetAppointmentService(
            mock<PatientAccessChecker>(),
            appointmentRepository,
            paymentRepository,
            mock<Authorizer>()
        );

        await expect(service.execute({actor, payload: {id: appointment.id}})).rejects.toThrow(AccessDeniedException);
        expect(paymentRepository.findByAppointmentId).not.toHaveBeenCalled();
    });

    it('hides appointment payment status from a member without financial permission', async () => {
        const appointmentRepository = mock<AppointmentRepository>();
        const paymentRepository = mock<AppointmentPaymentRepository>();
        const authorizer = mock<Authorizer>();
        const appointment = Appointment.create({
            clinicId: actor.clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: ClinicMemberId.generate(),
            startAt: new Date('2030-01-01T09:00:00.000Z'),
            endAt: new Date('2030-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.RETURN,
            note: null,
            roomId: null,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        authorizer.validate.mockResolvedValue(false);
        const service = new GetAppointmentService(
            mock<PatientAccessChecker>(),
            appointmentRepository,
            paymentRepository,
            authorizer
        );

        await expect(service.execute({actor, payload: {id: appointment.id}})).resolves.toMatchObject({
            paymentStatus: null,
        });
        expect(paymentRepository.findByAppointmentId).not.toHaveBeenCalled();
    });
});
