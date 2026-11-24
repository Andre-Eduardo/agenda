import {mockDeep} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {UserId} from '@domain/user/entities';
import {AppointmentMapper} from '@infrastructure/mappers/appointment.mapper';
import {AppointmentPrismaRepository} from '@infrastructure/repository/appointment.prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';
import {PrismaService} from '@infrastructure/repository/prisma/prisma.service';

describe('AppointmentPrismaRepository status history', () => {
    const prisma = mockDeep<PrismaService>();
    const provider = mockDeep<PrismaProvider>();

    Object.defineProperty(provider, 'client', {get: () => prisma});
    const repository = new AppointmentPrismaRepository(provider, new AppointmentMapper());
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };

    function arrivedAppointment(): Appointment {
        const appointment = Appointment.create({
            clinicId: actor.clinicId,
            patientId: PatientId.generate(),
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2027-01-01T09:00:00.000Z'),
            endAt: new Date('2027-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
            status: AppointmentStatus.CONFIRMED,
        });

        appointment.checkin();

        return appointment;
    }

    beforeEach(() => {
        jest.clearAllMocks();
        provider.runAtomically.mockImplementation((callback) => callback());
    });

    it('writes the status and actor record in one transaction after comparing the previous status', async () => {
        const appointment = arrivedAppointment();

        prisma.appointment.updateMany.mockResolvedValue({count: 1});

        await repository.saveStatusTransition(appointment, AppointmentStatus.CONFIRMED, actor, null);

        expect(provider.runAtomically).toHaveBeenCalledTimes(1);
        expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: appointment.id.toString(),
                    clinicId: actor.clinicId.toString(),
                    status: AppointmentStatus.CONFIRMED,
                }),
                data: expect.objectContaining({status: AppointmentStatus.ARRIVED}),
            })
        );
        expect(prisma.appointmentStatusTransition.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: appointment.id.toString(),
                clinicId: actor.clinicId.toString(),
                actorUserId: actor.userId.toString(),
                actorMemberId: actor.clinicMemberId.toString(),
                fromStatus: AppointmentStatus.CONFIRMED,
                toStatus: AppointmentStatus.ARRIVED,
                reason: null,
                occurredAt: appointment.updatedAt,
            }),
        });
    });

    it('rejects a stale transition without writing a history row', async () => {
        const appointment = arrivedAppointment();

        prisma.appointment.updateMany.mockResolvedValue({count: 0});

        await expect(
            repository.saveStatusTransition(appointment, AppointmentStatus.CONFIRMED, actor, null)
        ).rejects.toThrow(PreconditionException);
        expect(prisma.appointmentStatusTransition.create).not.toHaveBeenCalled();
    });
});
