import {mock} from 'jest-mock-extended';
import type {Metrics} from '@application/@shared/telemetry';
import {ReminderMessageRenderer} from '@application/clinic-reminder-config/services/reminder-message.renderer';
import {Phone} from '@domain/@shared/value-objects';
import {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    type AppointmentReminderEvent,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
    ReminderStatus,
} from '@domain/appointment-reminder/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId, type Appointment} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {NotificationProvider} from '@domain/notification/ports/notification-provider.port';
import {PatientId, type Patient} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';
import {DispatchRemindersService, REMINDER_DISPATCH_LEASE_MS} from '../dispatch-reminders.service';

describe('A dispatch-reminders service', () => {
    const clinicId = ClinicId.generate();
    const reminderRepository = mock<AppointmentReminderRepository>();
    const appointmentRepository = mock<AppointmentRepository>();
    const patientRepository = mock<PatientRepository>();
    const messageRenderer = mock<ReminderMessageRenderer>();
    const eventRepository = mock<AppointmentReminderEventRepository>();
    const metrics = mock<Metrics>();
    const whatsApp = mock<NotificationProvider>({channel: ReminderChannel.WHATSAPP});
    const email = mock<NotificationProvider>({channel: ReminderChannel.EMAIL});

    const professionalId = ClinicMemberId.generate();
    const appointment = mock<Appointment>({
        startAt: new Date('2026-12-01T13:30:00Z'),
        attendedByMemberId: professionalId,
    });
    const patient = mock<Patient>({
        name: 'Maria',
        email: 'maria@example.com',
        phone: Phone.create('11987654321'),
    });

    const service = new DispatchRemindersService(
        reminderRepository,
        appointmentRepository,
        patientRepository,
        messageRenderer,
        [whatsApp, email],
        eventRepository,
        metrics
    );

    function recordedEvents(): Array<Pick<AppointmentReminderEvent, 'type' | 'attempt' | 'detail' | 'source'>> {
        return eventRepository.recordIfAbsent.mock.calls.map(([event]) => ({
            type: event.type,
            attempt: event.attempt,
            detail: event.detail,
            source: event.source,
        }));
    }

    function reminder(channel: ReminderChannel): AppointmentReminder {
        return AppointmentReminder.create({
            clinicId,
            appointmentId: AppointmentId.generate(),
            patientId: PatientId.generate(),
            channel,
            scheduledAt: new Date('2026-11-30T13:30:00Z'),
        });
    }

    beforeEach(() => {
        jest.resetAllMocks();
        jest.useFakeTimers({now: new Date('2026-11-30T13:30:00Z'), doNotFake: ['nextTick', 'setImmediate']});
        eventRepository.recordIfAbsent.mockResolvedValue(true);
        reminderRepository.claimForDispatch.mockResolvedValue(true);
        appointmentRepository.findById.mockResolvedValue(appointment);
        patientRepository.findById.mockResolvedValue(patient);
        messageRenderer.render.mockResolvedValue('Olá, Maria! Sua consulta é em 01/12/2026 às 10:30.');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should claim each due reminder before sending it', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(reminderRepository.claimForDispatch).toHaveBeenCalledWith(due.id, REMINDER_DISPATCH_LEASE_MS);
        expect(whatsApp.send).toHaveBeenCalledTimes(1);
    });

    it('should skip a reminder already claimed by another instance', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        reminderRepository.claimForDispatch.mockResolvedValue(false);

        await service.dispatchDue(clinicId);

        expect(whatsApp.send).not.toHaveBeenCalled();
        expect(reminderRepository.save).not.toHaveBeenCalled();
        expect(eventRepository.recordIfAbsent).not.toHaveBeenCalled();
        expect(due.status).toBe(ReminderStatus.PENDING);
    });

    it('should send a reminder only once when two instances race for the same batch', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);
        let claimed = false;

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        reminderRepository.claimForDispatch.mockImplementation(() => {
            if (claimed) return Promise.resolve(false);

            claimed = true;

            return Promise.resolve(true);
        });
        whatsApp.send.mockResolvedValue({success: true});

        await Promise.all([service.dispatchDue(clinicId), service.dispatchDue(clinicId)]);

        expect(whatsApp.send).toHaveBeenCalledTimes(1);
    });

    it('should send a WhatsApp reminder to the patient phone and mark it as sent', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: true, providerId: 'msg-1'});

        await service.dispatchDue(clinicId);

        expect(whatsApp.send).toHaveBeenCalledWith({
            clinicId,
            to: '11987654321',
            subject: 'Lembrete de consulta',
            message: 'Olá, Maria! Sua consulta é em 01/12/2026 às 10:30.',
            metadata: {
                reminderId: due.id.toString(),
                appointmentId: due.appointmentId.toString(),
                patientId: due.patientId.toString(),
            },
        });
        expect(messageRenderer.render).toHaveBeenCalledWith({
            clinicId,
            patientName: 'Maria',
            startAt: appointment.startAt,
            professionalId,
        });
        expect(due.status).toBe(ReminderStatus.SENT);
        expect(reminderRepository.save).toHaveBeenCalledWith(due);
    });

    it('should keep the provider message id and destination and record the attempt on the timeline', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: true, providerId: 'msg-1', destination: '5511987654321'});

        await service.dispatchDue(clinicId);

        expect(due.providerMessageId).toBe('msg-1');
        expect(due.destination).toBe('5511987654321');
        expect(due.attempts).toBe(1);
        expect(recordedEvents()).toEqual([
            {type: ReminderEventType.SENT, attempt: 1, detail: null, source: ReminderEventSource.SYSTEM},
        ]);
        expect(metrics.count).toHaveBeenCalledWith('notification.reminder.attempt', 1, {
            channel: ReminderChannel.WHATSAPP,
            outcome: 'sent',
        });
    });

    it('should send an e-mail reminder to the patient e-mail', async () => {
        const due = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        email.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(email.send).toHaveBeenCalledWith(expect.objectContaining({to: 'maria@example.com'}));
        expect(due.status).toBe(ReminderStatus.SENT);
    });

    it('should record the provider error and schedule a retry 15 minutes later', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: false, error: 'Evolution API error 404'});

        await service.dispatchDue(clinicId);

        expect(due.status).toBe(ReminderStatus.PENDING);
        expect(due.scheduledAt).toEqual(new Date('2026-11-30T13:45:00Z'));
        expect(due.errorMessage).toBe('Evolution API error 404');
        expect(due.attempts).toBe(1);
        expect(reminderRepository.save).toHaveBeenCalledWith(due);
        expect(recordedEvents()).toEqual([
            {
                type: ReminderEventType.SEND_FAILED,
                attempt: 1,
                detail: 'Evolution API error 404',
                source: ReminderEventSource.SYSTEM,
            },
            {
                type: ReminderEventType.RETRY_SCHEDULED,
                attempt: 1,
                detail: '2026-11-30T13:45:00.000Z',
                source: ReminderEventSource.SYSTEM,
            },
        ]);
        expect(metrics.count).toHaveBeenCalledWith('notification.reminder.attempt', 1, {
            channel: ReminderChannel.WHATSAPP,
            outcome: 'retry',
        });
    });

    it('should fail for good after the third attempt', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        due.attempts = 2;
        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: false, error: 'Evolution API error 500'});

        await service.dispatchDue(clinicId);

        expect(due.status).toBe(ReminderStatus.FAILED);
        expect(due.attempts).toBe(3);
        expect(recordedEvents().map((event) => event.type)).toEqual([ReminderEventType.SEND_FAILED]);
        expect(metrics.count).toHaveBeenCalledWith('notification.reminder.attempt', 1, {
            channel: ReminderChannel.WHATSAPP,
            outcome: 'failed',
        });
    });

    it('should not schedule a retry past the appointment start', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        jest.setSystemTime(new Date('2026-12-01T13:20:00Z'));
        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: false, error: 'timeout'});

        await service.dispatchDue(clinicId);

        expect(due.status).toBe(ReminderStatus.FAILED);
    });

    it('should record a failure when the provider throws and keep dispatching the batch', async () => {
        const first = reminder(ReminderChannel.WHATSAPP);
        const second = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([first, second]);
        whatsApp.send.mockRejectedValue(new Error('socket hang up'));
        email.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(first.status).toBe(ReminderStatus.PENDING);
        expect(first.errorMessage).toBe('socket hang up');
        expect(second.status).toBe(ReminderStatus.SENT);
    });

    it('should keep dispatching when saving one reminder fails', async () => {
        const first = reminder(ReminderChannel.WHATSAPP);
        const second = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([first, second]);
        reminderRepository.save.mockRejectedValueOnce(new Error('db down'));
        whatsApp.send.mockResolvedValue({success: true});
        email.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(email.send).toHaveBeenCalled();
        expect(reminderRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should fail the reminder when the patient has no e-mail', async () => {
        const due = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        patientRepository.findById.mockResolvedValue(mock<Patient>({name: 'Maria', email: null, phone: null}));

        await service.dispatchDue(clinicId);

        expect(email.send).not.toHaveBeenCalled();
        expect(due.status).toBe(ReminderStatus.FAILED);
        expect(due.errorMessage).toContain('has no email address');
        // Missing contact data does not fix itself, so there is no retry.
        expect(recordedEvents().map((event) => event.type)).toEqual([ReminderEventType.SEND_FAILED]);
    });
});
