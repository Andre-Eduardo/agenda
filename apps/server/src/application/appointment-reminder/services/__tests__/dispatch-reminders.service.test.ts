import {mock, mockReset} from 'jest-mock-extended';
import {
    DispatchRemindersService,
    REMINDER_DISPATCH_LEASE_MS,
} from '@application/appointment-reminder/services/dispatch-reminders.service';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    ReminderChannel,
    ReminderStatus,
} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId, type Appointment} from '@domain/appointment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {NotificationProvider} from '@domain/notification/ports/notification-provider.port';
import {PatientId, type Patient} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

describe('DispatchRemindersService', () => {
    const clinicId = ClinicId.generate();
    const reminderRepository = mock<AppointmentReminderRepository>();
    const appointmentRepository = mock<AppointmentRepository>();
    const patientRepository = mock<PatientRepository>();
    const emailProvider = mock<NotificationProvider>({channel: ReminderChannel.EMAIL});

    const service = new DispatchRemindersService(reminderRepository, appointmentRepository, patientRepository, [
        emailProvider,
    ]);

    const buildReminder = () =>
        AppointmentReminder.create({
            clinicId,
            appointmentId: AppointmentId.generate(),
            patientId: PatientId.generate(),
            channel: ReminderChannel.EMAIL,
            scheduledAt: new Date('2026-12-01T12:00:00.000Z'),
        });

    beforeEach(() => {
        mockReset(reminderRepository);
        mockReset(appointmentRepository);
        mockReset(patientRepository);
        emailProvider.send.mockReset();

        appointmentRepository.findById.mockResolvedValue(
            mock<Appointment>({startAt: new Date('2026-12-01T19:00:00.000Z')})
        );
        patientRepository.findById.mockResolvedValue(mock<Patient>({name: 'Ana', email: 'ana@example.com'}));
        emailProvider.send.mockResolvedValue({success: true});
    });

    it('claims each due reminder before sending it', async () => {
        const reminder = buildReminder();

        reminderRepository.findDueForDispatch.mockResolvedValue([reminder]);
        reminderRepository.claimForDispatch.mockResolvedValue(true);

        await service.dispatchDue(clinicId);

        expect(reminderRepository.claimForDispatch).toHaveBeenCalledWith(reminder.id, REMINDER_DISPATCH_LEASE_MS);
        expect(emailProvider.send).toHaveBeenCalledTimes(1);
        expect(emailProvider.send.mock.calls[0][0].message).toContain('às 16:00');
        expect(reminder.status).toBe(ReminderStatus.SENT);
        expect(reminderRepository.save).toHaveBeenCalledWith(reminder);
    });

    it('skips a reminder already claimed by another instance', async () => {
        const reminder = buildReminder();

        reminderRepository.findDueForDispatch.mockResolvedValue([reminder]);
        reminderRepository.claimForDispatch.mockResolvedValue(false);

        await service.dispatchDue(clinicId);

        expect(emailProvider.send).not.toHaveBeenCalled();
        expect(reminderRepository.save).not.toHaveBeenCalled();
        expect(reminder.status).toBe(ReminderStatus.PENDING);
    });

    it('sends each reminder only once when two instances race for the same batch', async () => {
        const reminder = buildReminder();
        let claimed = false;

        reminderRepository.findDueForDispatch.mockImplementation(async () => [reminder]);
        reminderRepository.claimForDispatch.mockImplementation(async () => {
            if (claimed) return false;

            claimed = true;

            return true;
        });

        await Promise.all([service.dispatchDue(clinicId), service.dispatchDue(clinicId)]);

        expect(emailProvider.send).toHaveBeenCalledTimes(1);
    });

    it('marks the reminder as failed when the provider fails', async () => {
        const reminder = buildReminder();

        reminderRepository.findDueForDispatch.mockResolvedValue([reminder]);
        reminderRepository.claimForDispatch.mockResolvedValue(true);
        emailProvider.send.mockResolvedValue({success: false, error: 'boom'});

        await service.dispatchDue(clinicId);

        expect(reminder.status).toBe(ReminderStatus.FAILED);
        expect(reminder.errorMessage).toBe('boom');
        expect(reminderRepository.save).toHaveBeenCalledWith(reminder);
    });
});
