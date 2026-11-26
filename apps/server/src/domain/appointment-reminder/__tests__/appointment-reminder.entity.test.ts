import {
    AppointmentReminder,
    AppointmentReminderEvent,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
    ReminderStatus,
} from '@domain/appointment-reminder/entities';
import {AppointmentId} from '@domain/appointment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';

describe('An appointment reminder', () => {
    const sentAt = new Date('2026-11-30T13:30:00Z');
    const later = new Date('2026-11-30T13:31:00Z');

    function reminder(): AppointmentReminder {
        return AppointmentReminder.create({
            clinicId: ClinicId.generate(),
            appointmentId: AppointmentId.generate(),
            patientId: PatientId.generate(),
            channel: ReminderChannel.WHATSAPP,
            scheduledAt: sentAt,
        });
    }

    function sent(): AppointmentReminder {
        const result = reminder();

        result.markSent(sentAt, {destination: '5511987654321', providerMessageId: 'msg-1'});

        return result;
    }

    it('should count every attempt and keep what the provider accepted', () => {
        const result = reminder();

        result.markFailed(sentAt, 'timeout', later);
        result.markSent(later, {destination: '5511987654321', providerMessageId: 'msg-1'});

        expect(result.attempts).toBe(2);
        expect(result.status).toBe(ReminderStatus.SENT);
        expect(result.errorMessage).toBeNull();
        expect(result.destination).toBe('5511987654321');
        expect(result.providerMessageId).toBe('msg-1');
    });

    it('should go back to the queue when a retry is scheduled', () => {
        const result = reminder();

        result.markFailed(sentAt, 'timeout', later);

        expect(result.status).toBe(ReminderStatus.PENDING);
        expect(result.scheduledAt).toEqual(later);
        expect(result.failedAt).toEqual(sentAt);
    });

    it('should fail for good without a retry', () => {
        const result = reminder();

        result.markFailed(sentAt, 'no phone');

        expect(result.status).toBe(ReminderStatus.FAILED);
    });

    it('should only move forward from sent to delivered, read and replied', () => {
        const result = sent();

        expect(result.markRead(later)).toBe(true);
        expect(result.status).toBe(ReminderStatus.READ);
        // Read implies delivered.
        expect(result.deliveredAt).toEqual(later);

        // A late delivery ack does not move the status back.
        expect(result.markDelivered(later)).toBe(false);
        expect(result.status).toBe(ReminderStatus.READ);

        expect(result.markReplied(later)).toBe(true);
        expect(result.status).toBe(ReminderStatus.REPLIED);
        expect(result.repliedAt).toEqual(later);
    });

    it('should report a second reply as no change', () => {
        const result = sent();

        result.markReplied(later);

        expect(result.markReplied(new Date('2026-11-30T14:00:00Z'))).toBe(false);
        expect(result.repliedAt).toEqual(later);
    });

    it('should ignore delivery updates for a reminder that was never sent', () => {
        const result = reminder();

        expect(result.markDelivered(later)).toBe(false);
        expect(result.markReplied(later)).toBe(false);
        expect(result.status).toBe(ReminderStatus.PENDING);
    });

    it('should fail on a bounce after it was sent', () => {
        const result = sent();

        expect(result.markDeliveryFailed(later, 'Bounce Permanent/General')).toBe(true);
        expect(result.status).toBe(ReminderStatus.FAILED);
        expect(result.errorMessage).toBe('Bounce Permanent/General');
    });

    it('should ignore a delivery failure once the patient read the message', () => {
        const result = sent();

        result.markRead(later);

        expect(result.markDeliveryFailed(later, 'error ack')).toBe(false);
        expect(result.status).toBe(ReminderStatus.READ);
    });
});

describe('An appointment reminder event', () => {
    it('should keep at most 500 characters of detail and drop blank details', () => {
        const base = {
            clinicId: ClinicId.generate(),
            reminderId: AppointmentReminder.create({
                clinicId: ClinicId.generate(),
                appointmentId: AppointmentId.generate(),
                patientId: PatientId.generate(),
                channel: ReminderChannel.EMAIL,
                scheduledAt: new Date(),
            }).id,
            type: ReminderEventType.REPLIED,
            source: ReminderEventSource.EVOLUTION,
            occurredAt: new Date(),
        };

        const long = AppointmentReminderEvent.record({...base, detail: 'a'.repeat(600)});
        const blank = AppointmentReminderEvent.record({...base, detail: '   '});

        expect(long.detail).toHaveLength(500);
        expect(long.detail?.endsWith('…')).toBe(true);
        expect(blank.detail).toBeNull();
        expect(blank.externalId).toBeNull();
    });
});
