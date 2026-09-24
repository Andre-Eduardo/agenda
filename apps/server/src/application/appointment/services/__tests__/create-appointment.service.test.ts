import {mock} from 'jest-mock-extended';
import {CreateAppointmentService} from '@application/appointment/services/create-appointment.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {AgendaAccessChecker} from '@application/professional-agenda-access/services';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicMember} from '@domain/clinic-member/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import type {Patient} from '@domain/patient/entities';
import {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';
import {MemberBlockRepository} from '@domain/professional/member-block.repository';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import {WorkingHoursRepository} from '@domain/professional/working-hours.repository';
import {RoomRepository} from '@domain/room/room.repository';

describe('CreateAppointmentService', () => {
    const clinicId = ClinicId.generate();
    const attendedByMemberId = ClinicMemberId.generate();
    const actor = {
        userId: null,
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    } as unknown as Actor;

    const attendedBy = {clinicId} as unknown as ClinicMember;
    const patient = {} as unknown as Patient;

    let appointmentRepository: ReturnType<typeof mock<AppointmentRepository>>;
    let clinicMemberRepository: ReturnType<typeof mock<ClinicMemberRepository>>;
    let clinicRepository: ReturnType<typeof mock<ClinicRepository>>;
    let patientRepository: ReturnType<typeof mock<PatientRepository>>;
    let professionalRepository: ReturnType<typeof mock<ProfessionalRepository>>;
    let roomRepository: ReturnType<typeof mock<RoomRepository>>;
    let workingHoursRepository: ReturnType<typeof mock<WorkingHoursRepository>>;
    let memberBlockRepository: ReturnType<typeof mock<MemberBlockRepository>>;
    let agendaAccessChecker: ReturnType<typeof mock<AgendaAccessChecker>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let atomicExecutor: ReturnType<typeof mock<AtomicExecutor>>;
    let service: CreateAppointmentService;

    const payload = {
        patientId: PatientId.generate(),
        attendedByMemberId,
        startAt: new Date('2020-01-01T09:00:00.000Z'),
        endAt: new Date('2020-01-01T10:00:00.000Z'),
        type: 'FIRST_VISIT' as AppointmentType,
        note: null,
        retroactive: true,
        confirmOutsideAvailability: false,
    };

    beforeEach(() => {
        appointmentRepository = mock<AppointmentRepository>();
        clinicMemberRepository = mock<ClinicMemberRepository>();
        clinicRepository = mock<ClinicRepository>();
        patientRepository = mock<PatientRepository>();
        professionalRepository = mock<ProfessionalRepository>();
        roomRepository = mock<RoomRepository>();
        workingHoursRepository = mock<WorkingHoursRepository>();
        memberBlockRepository = mock<MemberBlockRepository>();
        agendaAccessChecker = mock<AgendaAccessChecker>();
        eventDispatcher = mock<EventDispatcher>();
        atomicExecutor = mock<AtomicExecutor>();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());

        clinicMemberRepository.findById.mockResolvedValue(attendedBy);
        patientRepository.findById.mockResolvedValue(patient);
        clinicRepository.findById.mockResolvedValue(null);
        workingHoursRepository.findByMemberAndDay.mockResolvedValue([]);
        memberBlockRepository.findOverlapping.mockResolvedValue([]);
        appointmentRepository.findConflicts.mockResolvedValue([]);
        agendaAccessChecker.assertCanManage.mockResolvedValue(undefined);

        service = new CreateAppointmentService(
            appointmentRepository,
            mock<PatientAccessChecker>(),
            clinicMemberRepository,
            clinicRepository,
            patientRepository,
            professionalRepository,
            roomRepository,
            workingHoursRepository,
            memberBlockRepository,
            agendaAccessChecker,
            eventDispatcher
        );
        (service as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;
    });

    it('checks agenda access for the attended member before creating the appointment', async () => {
        await service.execute({actor, payload});

        expect(agendaAccessChecker.assertCanManage).toHaveBeenCalledWith(actor, attendedByMemberId);
        expect(appointmentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('propagates AccessDeniedException and does not create the appointment', async () => {
        agendaAccessChecker.assertCanManage.mockRejectedValue(
            new AccessDeniedException('denied', AccessDeniedReason.INSUFFICIENT_PERMISSIONS)
        );

        await expect(service.execute({actor, payload})).rejects.toThrow(AccessDeniedException);

        expect(appointmentRepository.save).not.toHaveBeenCalled();
    });
});
