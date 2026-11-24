import {mock} from 'jest-mock-extended';
import {ListAppointmentStatusTransitionsService} from '@application/appointment/services/list-appointment-status-transitions.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {UserId} from '@domain/user/entities';

describe('ListAppointmentStatusTransitionsService', () => {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const repository = mock<AppointmentRepository>();
    const patientAccessChecker = mock<PatientAccessChecker>();
    const service = new ListAppointmentStatusTransitionsService(patientAccessChecker, repository);

    function appointmentFor(clinicId: ClinicId): Appointment {
        return Appointment.create({
            clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2027-03-01T09:00:00.000Z'),
            endAt: new Date('2027-03-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
        });
    }

    beforeEach(() => jest.resetAllMocks());

    it('returns the recorded actor, time and reason to an authorized member', async () => {
        const appointment = appointmentFor(actor.clinicId);
        const occurredAt = new Date('2027-03-01T08:00:00.000Z');

        repository.findById.mockResolvedValue(appointment);
        repository.listStatusTransitions.mockResolvedValue([
            {
                id: 'transition-id',
                clinicId: actor.clinicId,
                appointmentId: appointment.id,
                actorUserId: actor.userId,
                actorMemberId: actor.clinicMemberId,
                fromStatus: AppointmentStatus.SCHEDULED,
                toStatus: AppointmentStatus.CANCELLED,
                reason: 'Solicitação do paciente',
                occurredAt,
            },
        ]);

        const result = await service.execute({actor, payload: {id: appointment.id}});

        expect(patientAccessChecker.assertCanAccess).toHaveBeenCalledWith(actor, appointment.patientId, 'appointment');
        expect(repository.listStatusTransitions).toHaveBeenCalledWith(appointment.id, actor.clinicId);
        expect(result).toEqual([
            expect.objectContaining({
                actorUserId: actor.userId.toString(),
                actorMemberId: actor.clinicMemberId.toString(),
                toStatus: AppointmentStatus.CANCELLED,
                reason: 'Solicitação do paciente',
                occurredAt: occurredAt.toISOString(),
            }),
        ]);
    });

    it('does not read history for another clinic', async () => {
        const appointment = appointmentFor(ClinicId.generate());

        repository.findById.mockResolvedValue(appointment);

        await expect(service.execute({actor, payload: {id: appointment.id}})).rejects.toThrow(AccessDeniedException);
        expect(repository.listStatusTransitions).not.toHaveBeenCalled();
    });

    it('does not read history when patient access is denied', async () => {
        const appointment = appointmentFor(actor.clinicId);

        repository.findById.mockResolvedValue(appointment);
        patientAccessChecker.assertCanAccess.mockRejectedValue(new Error('Access denied'));

        await expect(service.execute({actor, payload: {id: appointment.id}})).rejects.toThrow('Access denied');
        expect(repository.listStatusTransitions).not.toHaveBeenCalled();
    });
});
