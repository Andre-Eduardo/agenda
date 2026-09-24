import {mock} from 'jest-mock-extended';
import {MarkNoShowAppointmentService} from '@application/appointment/services/mark-no-show-appointment.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentId, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';

describe('MarkNoShowAppointmentService', () => {
    const actor = {
        userId: null,
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    } as unknown as Actor;

    let appointmentRepository: ReturnType<typeof mock<AppointmentRepository>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let service: MarkNoShowAppointmentService;

    function createAppointment(status: AppointmentStatus): Appointment {
        return Appointment.create({
            clinicId: actor.clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2020-01-01T09:00:00.000Z'),
            endAt: new Date('2020-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
            status,
        });
    }

    beforeEach(() => {
        appointmentRepository = mock<AppointmentRepository>();
        eventDispatcher = mock<EventDispatcher>();
        service = new MarkNoShowAppointmentService(
            mock<PatientAccessChecker>(),
            appointmentRepository,
            eventDispatcher
        );
    });

    it('should mark a scheduled appointment as no-show', async () => {
        const appointment = createAppointment(AppointmentStatus.SCHEDULED);

        appointmentRepository.findById.mockResolvedValue(appointment);

        const result = await service.execute({actor, payload: {id: appointment.id}});

        expect(result.status).toBe(AppointmentStatus.NO_SHOW);
        expect(appointmentRepository.save).toHaveBeenCalledWith(appointment);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, appointment);
    });

    it('should throw when the appointment does not exist', async () => {
        appointmentRepository.findById.mockResolvedValue(null);

        await expect(service.execute({actor, payload: {id: AppointmentId.generate()}})).rejects.toThrow(
            ResourceNotFoundException
        );
    });

    it('should throw when the appointment is not in a no-showable status', async () => {
        const appointment = createAppointment(AppointmentStatus.CANCELLED);

        appointmentRepository.findById.mockResolvedValue(appointment);

        await expect(service.execute({actor, payload: {id: appointment.id}})).rejects.toThrow(PreconditionException);
    });
});
