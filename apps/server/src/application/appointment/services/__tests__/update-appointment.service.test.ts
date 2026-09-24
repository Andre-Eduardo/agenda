import {mock} from 'jest-mock-extended';
import {UpdateAppointmentService} from '@application/appointment/services/update-appointment.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {AgendaAccessChecker} from '@application/professional-agenda-access/services';
import type {Actor} from '@domain/@shared/actor';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {MemberBlockRepository} from '@domain/professional/member-block.repository';
import {WorkingHoursRepository} from '@domain/professional/working-hours.repository';
import {RoomRepository} from '@domain/room/room.repository';

describe('UpdateAppointmentService', () => {
    const clinicId = ClinicId.generate();
    const currentProfessionalId = ClinicMemberId.generate();
    const targetProfessionalId = ClinicMemberId.generate();
    const actor = {
        userId: null,
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    } as unknown as Actor;

    let appointmentRepository: ReturnType<typeof mock<AppointmentRepository>>;
    let clinicMemberRepository: ReturnType<typeof mock<ClinicMemberRepository>>;
    let clinicRepository: ReturnType<typeof mock<ClinicRepository>>;
    let roomRepository: ReturnType<typeof mock<RoomRepository>>;
    let workingHoursRepository: ReturnType<typeof mock<WorkingHoursRepository>>;
    let memberBlockRepository: ReturnType<typeof mock<MemberBlockRepository>>;
    let agendaAccessChecker: ReturnType<typeof mock<AgendaAccessChecker>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let atomicExecutor: ReturnType<typeof mock<AtomicExecutor>>;
    let service: UpdateAppointmentService;
    let appointment: Appointment;

    beforeEach(() => {
        appointmentRepository = mock<AppointmentRepository>();
        clinicMemberRepository = mock<ClinicMemberRepository>();
        clinicRepository = mock<ClinicRepository>();
        roomRepository = mock<RoomRepository>();
        workingHoursRepository = mock<WorkingHoursRepository>();
        memberBlockRepository = mock<MemberBlockRepository>();
        agendaAccessChecker = mock<AgendaAccessChecker>();
        eventDispatcher = mock<EventDispatcher>();
        atomicExecutor = mock<AtomicExecutor>();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());

        appointment = Appointment.create({
            clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId: currentProfessionalId,
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2030-01-01T09:00:00.000Z'),
            endAt: new Date('2030-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.RETURN,
            note: null,
            roomId: null,
        });
        appointmentRepository.findById.mockResolvedValue(appointment);
        clinicMemberRepository.findById.mockResolvedValue({clinicId} as never);
        clinicRepository.findById.mockResolvedValue(null);
        workingHoursRepository.findByMemberAndDay.mockResolvedValue([]);
        memberBlockRepository.findOverlapping.mockResolvedValue([]);
        appointmentRepository.findConflicts.mockResolvedValue([]);
        agendaAccessChecker.assertCanManage.mockResolvedValue(undefined);

        service = new UpdateAppointmentService(
            mock<PatientAccessChecker>(),
            appointmentRepository,
            clinicMemberRepository,
            clinicRepository,
            roomRepository,
            workingHoursRepository,
            memberBlockRepository,
            agendaAccessChecker,
            eventDispatcher
        );
        (service as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;
    });

    it('moves an appointment to a manageable professional after validating the target schedule', async () => {
        const result = await service.execute({
            actor,
            payload: {
                id: appointment.id,
                attendedByMemberId: targetProfessionalId,
                confirmOutsideAvailability: false,
            },
        });

        expect(agendaAccessChecker.assertCanManage).toHaveBeenCalledWith(actor, targetProfessionalId);
        expect(workingHoursRepository.findByMemberAndDay).toHaveBeenCalledWith(targetProfessionalId, 2);
        expect(appointmentRepository.lockMemberSchedule).toHaveBeenCalledTimes(2);
        expect(appointmentRepository.findConflicts).toHaveBeenCalledWith(
            targetProfessionalId,
            new Date('2030-01-01T09:00:00.000Z'),
            new Date('2030-01-01T10:00:00.000Z'),
            appointment.id
        );
        expect(result.attendedByMemberId).toBe(targetProfessionalId.toString());
        expect(appointmentRepository.save).toHaveBeenCalledTimes(1);
    });
});
