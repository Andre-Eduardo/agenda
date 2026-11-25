import {mock} from 'jest-mock-extended';
import {Phone} from '@domain/@shared/value-objects';
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
import {DispatchRemindersService} from '../dispatch-reminders.service';

describe('A dispatch-reminders service', () => {
    const clinicId = ClinicId.generate();
    const reminderRepository = mock<AppointmentReminderRepository>();
    const appointmentRepository = mock<AppointmentRepository>();
    const patientRepository = mock<PatientRepository>();
    const whatsApp = mock<NotificationProvider>({channel: ReminderChannel.WHATSAPP});
    const email = mock<NotificationProvider>({channel: ReminderChannel.EMAIL});

    const appointment = mock<Appointment>({startAt: new Date('2026-12-01T13:30:00Z')});
    const patient = mock<Patient>({
        name: 'Maria',
        email: 'maria@example.com',
        phone: Phone.create('11987654321'),
    });

    const service = new DispatchRemindersService(reminderRepository, appointmentRepository, patientRepository, [
        whatsApp,
        email,
    ]);

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
        appointmentRepository.findById.mockResolvedValue(appointment);
        patientRepository.findById.mockResolvedValue(patient);
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
            message: 'Olá, Maria! Lembramos que você tem uma consulta agendada para 01/12/2026 às 10:30.',
            metadata: {
                reminderId: due.id.toString(),
                appointmentId: due.appointmentId.toString(),
                patientId: due.patientId.toString(),
            },
        });
        expect(due.status).toBe(ReminderStatus.SENT);
        expect(reminderRepository.save).toHaveBeenCalledWith(due);
    });

    it('should send an e-mail reminder to the patient e-mail', async () => {
        const due = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        email.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(email.send).toHaveBeenCalledWith(expect.objectContaining({to: 'maria@example.com'}));
        expect(due.status).toBe(ReminderStatus.SENT);
    });

    it('should record the provider error as a failure', async () => {
        const due = reminder(ReminderChannel.WHATSAPP);

        reminderRepository.findDueForDispatch.mockResolvedValue([due]);
        whatsApp.send.mockResolvedValue({success: false, error: 'Evolution API error 404'});

        await service.dispatchDue(clinicId);

        expect(due.status).toBe(ReminderStatus.FAILED);
        expect(due.errorMessage).toBe('Evolution API error 404');
        expect(due.attempts).toBe(1);
        expect(reminderRepository.save).toHaveBeenCalledWith(due);
    });

    it('should record a failure when the provider throws and keep dispatching the batch', async () => {
        const first = reminder(ReminderChannel.WHATSAPP);
        const second = reminder(ReminderChannel.EMAIL);

        reminderRepository.findDueForDispatch.mockResolvedValue([first, second]);
        whatsApp.send.mockRejectedValue(new Error('socket hang up'));
        email.send.mockResolvedValue({success: true});

        await service.dispatchDue(clinicId);

        expect(first.status).toBe(ReminderStatus.FAILED);
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
    });
});
