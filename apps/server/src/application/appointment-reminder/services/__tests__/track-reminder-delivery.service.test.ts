import {mock} from 'jest-mock-extended';
import type {Metrics} from '@application/@shared/telemetry';
import type {AtomicExecutor} from '@domain/@shared/repository';
import type {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import type {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
    ReminderStatus,
} from '@domain/appointment-reminder/entities';
import {AppointmentId} from '@domain/appointment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {TrackReminderDeliveryService} from '../track-reminder-delivery.service';

describe('A track-reminder-delivery service', () => {
    const reminderRepository = mock<AppointmentReminderRepository>();
    const eventRepository = mock<AppointmentReminderEventRepository>();
    const metrics = mock<Metrics>();
    const atomicExecutor = mock<AtomicExecutor>();
    const service = new TrackReminderDeliveryService(reminderRepository, eventRepository, metrics);
    const at = new Date('2026-11-30T13:31:00Z');

    (service as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;

    function sentReminder(): AppointmentReminder {
        const reminder = AppointmentReminder.create({
            clinicId: ClinicId.generate(),
            appointmentId: AppointmentId.generate(),
            patientId: PatientId.generate(),
            channel: ReminderChannel.WHATSAPP,
            scheduledAt: at,
        });

        reminder.markSent(at, {destination: '5511987654321', providerMessageId: 'msg-1'});

        return reminder;
    }

    beforeEach(() => {
        jest.resetAllMocks();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());
    });

    it('should record the event, move the status and count it', async () => {
        const reminder = sentReminder();

        eventRepository.recordIfAbsent.mockResolvedValue(true);

        await expect(
            service.apply(reminder, {
                type: ReminderEventType.REPLIED,
                source: ReminderEventSource.EVOLUTION,
                externalId: 'in-1',
                occurredAt: at,
                detail: 'Confirmo',
            })
        ).resolves.toBe('applied');

        const [event] = eventRepository.recordIfAbsent.mock.calls[0]!;

        expect(event).toMatchObject({
            type: ReminderEventType.REPLIED,
            source: ReminderEventSource.EVOLUTION,
            externalId: 'in-1',
            attempt: 1,
            detail: 'Confirmo',
        });
        expect(reminder.status).toBe(ReminderStatus.REPLIED);
        expect(reminderRepository.save).toHaveBeenCalledWith(reminder);
        expect(atomicExecutor.runAtomically).toHaveBeenCalled();
        expect(metrics.count).toHaveBeenCalledWith('notification.reminder.status', 1, {
            channel: ReminderChannel.WHATSAPP,
            type: ReminderEventType.REPLIED,
        });
    });

    it('should change nothing for a repeated webhook delivery', async () => {
        const reminder = sentReminder();

        eventRepository.recordIfAbsent.mockResolvedValue(false);

        await expect(
            service.apply(reminder, {
                type: ReminderEventType.DELIVERED,
                source: ReminderEventSource.EVOLUTION,
                externalId: 'msg-1:DELIVERED',
                occurredAt: at,
            })
        ).resolves.toBe('duplicate');

        expect(reminder.status).toBe(ReminderStatus.SENT);
        expect(reminderRepository.save).not.toHaveBeenCalled();
        expect(metrics.count).not.toHaveBeenCalled();
    });

    it('should only record a complaint on the timeline', async () => {
        const reminder = sentReminder();

        eventRepository.recordIfAbsent.mockResolvedValue(true);

        await service.apply(reminder, {
            type: ReminderEventType.COMPLAINED,
            source: ReminderEventSource.SES,
            externalId: 'sns-1',
            occurredAt: at,
        });

        expect(reminder.status).toBe(ReminderStatus.SENT);
        expect(reminderRepository.save).not.toHaveBeenCalled();
    });
});
