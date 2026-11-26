import {UnauthorizedException} from '@nestjs/common';
import {mock} from 'jest-mock-extended';
import type {Metrics} from '@application/@shared/telemetry';
import type {TrackReminderDeliveryService} from '@application/appointment-reminder/services/track-reminder-delivery.service';
import type {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    ReminderChannel,
    ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';
import {AppointmentId} from '@domain/appointment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import type {SnsMessageVerifier} from '@infrastructure/aws/sns-message-verifier';
import type {EnvConfigService} from '@infrastructure/config';
import {ReceiveSesWebhookService} from '../receive-ses-webhook.service';

describe('A receive-SES-webhook service', () => {
    const topicArn = 'arn:aws:sns:sa-east-1:123:ses-events';
    const reminderRepository = mock<AppointmentReminderRepository>();
    const tracker = mock<TrackReminderDeliveryService>();
    const verifier = mock<SnsMessageVerifier>();
    const metrics = mock<Metrics>();
    const config = mock<EnvConfigService>({mail: {region: 'sa-east-1', eventsTopicArn: topicArn}});
    const service = new ReceiveSesWebhookService(config, verifier, reminderRepository, tracker, metrics);

    const reminder = AppointmentReminder.create({
        clinicId: ClinicId.generate(),
        appointmentId: AppointmentId.generate(),
        patientId: PatientId.generate(),
        channel: ReminderChannel.EMAIL,
        scheduledAt: new Date(),
    });

    const notification = {
        Type: 'Notification',
        MessageId: 'sns-1',
        TopicArn: topicArn,
        Message: JSON.stringify({
            eventType: 'Delivery',
            mail: {messageId: 'ses-1'},
            delivery: {timestamp: '2026-11-30T13:00:05.000Z'},
        }),
        Timestamp: '2026-11-30T13:00:06.000Z',
        SignatureVersion: '1',
        Signature: 'c2ln',
        SigningCertURL: 'https://sns.sa-east-1.amazonaws.com/cert.pem',
    };

    beforeEach(() => {
        jest.resetAllMocks();
        verifier.verify.mockResolvedValue(true);
        tracker.apply.mockResolvedValue('applied');
    });

    it('should apply a delivery, reading the text/plain body SNS sends', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);

        await service.receive(JSON.stringify(notification));

        expect(reminderRepository.findByProviderMessageId).toHaveBeenCalledWith(null, ReminderChannel.EMAIL, 'ses-1');
        expect(tracker.apply).toHaveBeenCalledWith(reminder, {
            type: ReminderEventType.DELIVERED,
            source: ReminderEventSource.SES,
            externalId: 'sns-1',
            occurredAt: new Date('2026-11-30T13:00:05.000Z'),
            detail: null,
        });
    });

    it('should reject a message from another topic without checking the signature', async () => {
        await expect(service.receive({...notification, TopicArn: 'arn:aws:sns:sa-east-1:999:other'})).rejects.toThrow(
            UnauthorizedException
        );
        expect(verifier.verify).not.toHaveBeenCalled();
    });

    it('should reject an invalid signature', async () => {
        verifier.verify.mockResolvedValue(false);

        await expect(service.receive(notification)).rejects.toThrow(UnauthorizedException);
        expect(tracker.apply).not.toHaveBeenCalled();
    });

    it('should reject everything when the topic is not configured', async () => {
        const disabled = new ReceiveSesWebhookService(
            mock<EnvConfigService>({mail: {region: 'sa-east-1', eventsTopicArn: undefined}}),
            verifier,
            reminderRepository,
            tracker,
            metrics
        );

        await expect(disabled.receive(notification)).rejects.toThrow(UnauthorizedException);
    });

    it('should confirm the subscription', async () => {
        const confirmation = {
            ...notification,
            Type: 'SubscriptionConfirmation',
            SubscribeURL: 'https://sns/x',
            Token: 't',
        };

        await service.receive(confirmation);

        expect(verifier.confirmSubscription).toHaveBeenCalledWith(expect.objectContaining({Token: 't'}));
    });

    it('should ignore an e-mail that is not a reminder', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(null);

        await service.receive(notification);

        expect(tracker.apply).not.toHaveBeenCalled();
        expect(metrics.count).toHaveBeenCalledWith('notification.webhook.received', 1, {
            source: 'ses',
            result: 'unmatched',
        });
    });
});
