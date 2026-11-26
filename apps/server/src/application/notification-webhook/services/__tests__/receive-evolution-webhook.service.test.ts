import {UnauthorizedException} from '@nestjs/common';
import {mock} from 'jest-mock-extended';
import type {Metrics} from '@application/@shared/telemetry';
import type {RecordPatientOptOutService} from '@application/patient-communication-preference/services/record-patient-opt-out.service';
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
import {CommunicationPreferenceSource} from '@domain/patient-communication-preference/entities';
import {PatientId} from '@domain/patient/entities';
import type {EnvConfigService} from '@infrastructure/config';
import {signEvolutionWebhookToken} from '@infrastructure/whatsapp/evolution-webhook-token';
import {ReceiveEvolutionWebhookService} from '../receive-evolution-webhook.service';

describe('A receive-Evolution-webhook service', () => {
    const clinicId = ClinicId.generate();
    const now = new Date('2026-11-30T13:30:00Z');
    const token = signEvolutionWebhookToken('secret', clinicId);
    const reminderRepository = mock<AppointmentReminderRepository>();
    const tracker = mock<TrackReminderDeliveryService>();
    const metrics = mock<Metrics>();
    const config = mock<EnvConfigService>({evolutionApi: {timeoutMs: 1000, webhookSecret: 'secret'}});
    const optOut = mock<RecordPatientOptOutService>();
    const service = new ReceiveEvolutionWebhookService(config, reminderRepository, tracker, metrics, optOut);

    const reminder = AppointmentReminder.create({
        clinicId,
        appointmentId: AppointmentId.generate(),
        patientId: PatientId.generate(),
        channel: ReminderChannel.WHATSAPP,
        scheduledAt: now,
    });

    const ack = {event: 'messages.update', data: {keyId: 'msg-1', fromMe: true, status: 'READ'}};

    beforeEach(() => {
        jest.resetAllMocks();
        tracker.apply.mockResolvedValue('applied');
    });

    it('should reject a missing or wrong token', async () => {
        await expect(service.receive({clinicId, token: undefined, body: ack}, now)).rejects.toThrow(
            UnauthorizedException
        );
        await expect(service.receive({clinicId: ClinicId.generate(), token, body: ack}, now)).rejects.toThrow(
            UnauthorizedException
        );
        expect(metrics.count).toHaveBeenCalledWith('notification.webhook.received', 1, {
            source: 'evolution',
            result: 'unauthorized',
        });
    });

    it('should reject every call when no secret is configured', async () => {
        const disabled = new ReceiveEvolutionWebhookService(
            mock<EnvConfigService>({evolutionApi: {timeoutMs: 1000, webhookSecret: undefined}}),
            reminderRepository,
            tracker,
            metrics,
            optOut
        );

        await expect(disabled.receive({clinicId, token, body: ack}, now)).rejects.toThrow(UnauthorizedException);
    });

    it('should apply a status ack to the reminder with that message id', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);

        await service.receive({clinicId, token, body: ack}, now);

        expect(reminderRepository.findByProviderMessageId).toHaveBeenCalledWith(
            clinicId,
            ReminderChannel.WHATSAPP,
            'msg-1'
        );
        expect(tracker.apply).toHaveBeenCalledWith(reminder, {
            type: ReminderEventType.READ,
            source: ReminderEventSource.EVOLUTION,
            externalId: 'msg-1:READ',
            occurredAt: now,
            detail: null,
        });
        expect(metrics.count).toHaveBeenCalledWith('notification.webhook.received', 1, {
            source: 'evolution',
            result: 'applied',
        });
    });

    it('should count acks of messages that are not reminders as unmatched', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(null);

        await service.receive({clinicId, token, body: ack}, now);

        expect(tracker.apply).not.toHaveBeenCalled();
        expect(metrics.count).toHaveBeenCalledWith('notification.webhook.received', 1, {
            source: 'evolution',
            result: 'unmatched',
        });
    });

    it('should attribute a reply that quotes the reminder', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);

        await service.receive(
            {
                clinicId,
                token,
                body: {
                    event: 'messages.upsert',
                    data: {
                        key: {id: 'in-1', remoteJid: '5511987654321@s.whatsapp.net', fromMe: false},
                        message: {extendedTextMessage: {text: 'Confirmo', contextInfo: {stanzaId: 'msg-1'}}},
                    },
                },
            },
            now
        );

        expect(reminderRepository.findLatestSentTo).not.toHaveBeenCalled();
        expect(tracker.apply).toHaveBeenCalledWith(
            reminder,
            expect.objectContaining({type: ReminderEventType.REPLIED, externalId: 'in-1', detail: 'Confirmo'})
        );
    });

    it('should attribute a plain reply to the latest reminder sent to that number in the last 7 days', async () => {
        reminderRepository.findLatestSentTo.mockResolvedValue(reminder);

        await service.receive(
            {
                clinicId,
                token,
                body: {
                    event: 'messages.upsert',
                    data: {
                        key: {id: 'in-1', remoteJid: '551187654321@s.whatsapp.net', fromMe: false},
                        message: {conversation: 'Sim'},
                    },
                },
            },
            now
        );

        expect(reminderRepository.findLatestSentTo).toHaveBeenCalledWith(
            clinicId,
            ReminderChannel.WHATSAPP,
            ['551187654321', '5511987654321'],
            new Date('2026-11-23T13:30:00Z')
        );
        expect(tracker.apply).toHaveBeenCalledWith(reminder, expect.objectContaining({detail: 'Sim'}));
    });

    it('should count a repeated delivery as a duplicate', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);
        tracker.apply.mockResolvedValue('duplicate');

        await service.receive({clinicId, token, body: ack}, now);

        expect(metrics.count).toHaveBeenCalledWith('notification.webhook.received', 1, {
            source: 'evolution',
            result: 'duplicate',
        });
    });

    function replyWith(text: string, id = 'in-9') {
        return {
            event: 'messages.upsert',
            data: {
                key: {id, remoteJid: '5511987654321@s.whatsapp.net', fromMe: false},
                message: {extendedTextMessage: {text, contextInfo: {stanzaId: 'msg-1'}}},
            },
        };
    }

    it('should opt the patient out of WhatsApp reminders when they reply SAIR', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);

        await service.receive({clinicId, token, body: replyWith('Sair.')}, now);

        expect(tracker.apply).toHaveBeenCalled();
        expect(optOut.record).toHaveBeenCalledWith(
            expect.objectContaining({
                reminder,
                source: CommunicationPreferenceSource.WHATSAPP_REPLY,
                externalId: 'in-9',
                reason: 'Sair.',
            })
        );
    });

    it('should not opt out on an ordinary reply that only contains the keyword', async () => {
        reminderRepository.findByProviderMessageId.mockResolvedValue(reminder);

        await service.receive({clinicId, token, body: replyWith('Não consigo sair do trabalho, posso remarcar?')}, now);

        expect(optOut.record).not.toHaveBeenCalled();
    });
});
