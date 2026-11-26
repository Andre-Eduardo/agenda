import {mock} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import type {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import type {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    AppointmentReminderEvent,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';
import type {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId, type Appointment} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {UserId} from '@domain/user/entities';
import {GetReminderTimelineService} from '../get-reminder-timeline.service';

describe('A get-reminder-timeline service', () => {
    const clinicId = ClinicId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const appointmentId = AppointmentId.generate();
    const appointmentRepository = mock<AppointmentRepository>();
    const reminderRepository = mock<AppointmentReminderRepository>();
    const eventRepository = mock<AppointmentReminderEventRepository>();
    const service = new GetReminderTimelineService(appointmentRepository, reminderRepository, eventRepository);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return each reminder with its own events', async () => {
        const at = new Date('2026-11-30T13:30:00Z');
        const reminders = [ReminderChannel.WHATSAPP, ReminderChannel.EMAIL].map((channel) =>
            AppointmentReminder.create({
                clinicId,
                appointmentId,
                patientId: PatientId.generate(),
                channel,
                scheduledAt: at,
            })
        );
        const event = AppointmentReminderEvent.record({
            clinicId,
            reminderId: reminders[0]!.id,
            type: ReminderEventType.SENT,
            source: ReminderEventSource.SYSTEM,
            attempt: 1,
            occurredAt: at,
        });

        appointmentRepository.findById.mockResolvedValue(mock<Appointment>({clinicId}));
        reminderRepository.findByAppointmentId.mockResolvedValue(reminders);
        eventRepository.findByReminderIds.mockResolvedValue([event]);

        const result = await service.execute({actor, payload: {clinicId, appointmentId}});

        expect(result).toHaveLength(2);
        expect(result[0]?.events).toEqual([
            {
                id: event.id.toString(),
                type: ReminderEventType.SENT,
                source: ReminderEventSource.SYSTEM,
                attempt: 1,
                detail: null,
                occurredAt: '2026-11-30T13:30:00.000Z',
            },
        ]);
        expect(result[1]?.events).toEqual([]);
    });

    it('should refuse another clinic', async () => {
        await expect(service.execute({actor, payload: {clinicId: ClinicId.generate(), appointmentId}})).rejects.toThrow(
            AccessDeniedException
        );

        appointmentRepository.findById.mockResolvedValue(mock<Appointment>({clinicId: ClinicId.generate()}));

        await expect(service.execute({actor, payload: {clinicId, appointmentId}})).rejects.toThrow(
            AccessDeniedException
        );
    });

    it('should fail for an unknown appointment', async () => {
        appointmentRepository.findById.mockResolvedValue(null);

        await expect(service.execute({actor, payload: {clinicId, appointmentId}})).rejects.toThrow(
            ResourceNotFoundException
        );
    });
});
