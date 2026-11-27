import {mock} from 'jest-mock-extended';
import {AttendanceScope, TRIAGE_NOT_RELEASED} from '@application/attendance/services/attendance-scope.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, PreconditionException} from '@domain/@shared/exceptions';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import type {AttendanceRepository} from '@domain/attendance/attendance.repository';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {fakeClinicMember} from '@domain/clinic-member/entities/__tests__/fake-clinic-member';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import {PatientId} from '@domain/patient/entities';
import {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';
import type {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

describe('AttendanceScope', () => {
    const clinicId = ClinicId.generate();
    const actorMemberId = ClinicMemberId.generate();
    const otherProfessional = ClinicMemberId.generate();
    const actor = {userId: null, clinicId, clinicMemberId: actorMemberId, ip: '127.0.0.1'} as unknown as Actor;
    const members = mock<ClinicMemberRepository>();
    const agendaAccess = mock<ProfessionalAgendaAccessRepository>();
    const clinics = mock<ClinicRepository>();
    const attendance = mock<AttendanceRepository>();
    const scope = new AttendanceScope(members, agendaAccess, clinics, attendance);

    function withRoles(...roles: ClinicMemberRole[]) {
        members.findById.mockResolvedValue(fakeClinicMember({id: actorMemberId, clinicId, roles}));
    }

    function appointmentFor(attendedByMemberId: ClinicMemberId) {
        return Appointment.create({
            clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId,
            createdByMemberId: actorMemberId,
            startAt: new Date('2030-01-01T09:00:00.000Z'),
            endAt: new Date('2030-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
            status: AppointmentStatus.ARRIVED,
        });
    }

    beforeEach(() => {
        jest.resetAllMocks();
        agendaAccess.findByGranteeId.mockResolvedValue([]);
        clinics.findById.mockResolvedValue(fakeClinic({id: clinicId, triageRequired: false}));
    });

    it('lets owners and admins operate every agenda', async () => {
        withRoles(ClinicMemberRole.ADMIN);

        await expect(scope.operableAgendas(actor)).resolves.toBeNull();
    });

    it('limits a professional to their own agenda, even with an agenda grant', async () => {
        withRoles(ClinicMemberRole.PROFESSIONAL);
        agendaAccess.findByGranteeId.mockResolvedValue([
            ProfessionalAgendaAccess.create({
                clinicId,
                granteeMemberId: actorMemberId,
                professionalMemberId: otherProfessional,
            }),
        ]);

        await expect(scope.operableAgendas(actor)).resolves.toEqual([actorMemberId]);
        await expect(scope.assertCanOperate(actor, otherProfessional)).rejects.toThrow(AccessDeniedException);
        await expect(scope.assertCanOperate(actor, actorMemberId)).resolves.toBeUndefined();
    });

    it('lets reception operate the agendas it was granted', async () => {
        withRoles(ClinicMemberRole.SECRETARY);
        agendaAccess.findByGranteeId.mockResolvedValue([
            ProfessionalAgendaAccess.create({
                clinicId,
                granteeMemberId: actorMemberId,
                professionalMemberId: otherProfessional,
            }),
        ]);

        await expect(scope.assertCanOperate(actor, otherProfessional)).resolves.toBeUndefined();
        await expect(scope.assertCanOperate(actor, ClinicMemberId.generate())).rejects.toThrow(AccessDeniedException);
    });

    it('denies inactive members', async () => {
        members.findById.mockResolvedValue(
            fakeClinicMember({id: actorMemberId, clinicId, roles: [ClinicMemberRole.OWNER], isActive: false})
        );

        await expect(scope.operableAgendas(actor)).resolves.toEqual([]);
    });

    it('blocks the call until the triage releases the patient when the clinic requires it', async () => {
        withRoles(ClinicMemberRole.PROFESSIONAL);
        clinics.findById.mockResolvedValue(fakeClinic({id: clinicId, triageRequired: true}));
        const appointment = appointmentFor(actorMemberId);

        attendance.findTriage.mockResolvedValue(null);
        await expect(scope.assertCanCall(actor, appointment)).rejects.toThrowWithMessage(
            PreconditionException,
            TRIAGE_NOT_RELEASED
        );

        attendance.findTriage.mockResolvedValue({
            appointmentId: appointment.id.toString(),
            weightKg: null,
            heightCm: null,
            systolicPressure: null,
            diastolicPressure: null,
            heartRate: null,
            temperatureCelsius: null,
            oxygenSaturation: null,
            notes: null,
            releasedAt: new Date(),
            releasedByMemberId: null,
            updatedAt: new Date(),
        });
        await expect(scope.assertCanCall(actor, appointment)).resolves.toBeUndefined();
    });

    it('does not look at the triage when the clinic does not require it', async () => {
        withRoles(ClinicMemberRole.PROFESSIONAL);

        await expect(scope.assertCanCall(actor, appointmentFor(actorMemberId))).resolves.toBeUndefined();
        expect(attendance.findTriage).not.toHaveBeenCalled();
    });
});
