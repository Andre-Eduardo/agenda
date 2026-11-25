import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';
import {ConfigService} from '@nestjs/config';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {ClinicId} from '@domain/clinic/entities';
import {EnvConfigService, type EnvConfig} from '@infrastructure/config';
import {SES_CHARSET, SesEmailProvider, toHtmlBody} from '../ses-email.provider';

jest.mock('@aws-sdk/client-sesv2', () => ({
    SESv2Client: jest.fn(),
    SendEmailCommand: jest.fn((input: unknown) => ({input})),
}));

const SESv2ClientMock = jest.mocked(SESv2Client);
const clinicId = ClinicId.generate();

function makeProvider(mail: Partial<EnvConfig['mail']>): SesEmailProvider {
    return new SesEmailProvider(new EnvConfigService(new ConfigService({mail: {region: 'sa-east-1', ...mail}})));
}

describe('An Amazon SES e-mail provider', () => {
    const sendMock = jest.fn();

    beforeEach(() => {
        sendMock.mockReset();
        SESv2ClientMock.mockReset();
        SESv2ClientMock.mockReturnValue({send: sendMock} as unknown as SESv2Client);
    });

    it('should serve the e-mail channel', () => {
        expect(makeProvider({}).channel).toBe(ReminderChannel.EMAIL);
    });

    it('should be configured only when a sender address is set', () => {
        const withSender = new EnvConfigService(new ConfigService({mail: {fromAddress: 'no-reply@clinic.com'}}));
        const withoutSender = new EnvConfigService(new ConfigService({mail: {}}));

        expect(SesEmailProvider.isConfigured(withSender)).toBe(true);
        expect(SesEmailProvider.isConfigured(withoutSender)).toBe(false);
    });

    it('should send the message as text and escaped HTML', async () => {
        sendMock.mockResolvedValue({MessageId: 'ses-1'});

        const provider = makeProvider({
            fromAddress: 'no-reply@clinic.com',
            replyTo: 'contato@clinic.com',
            accessKeyId: 'AKIA',
            secretAccessKey: 'secret',
        });

        await expect(
            provider.send({clinicId, to: 'maria@example.com', subject: 'Lembrete', message: 'Olá, <Maria>!'})
        ).resolves.toEqual({success: true, providerId: 'ses-1'});

        expect(SESv2ClientMock).toHaveBeenCalledWith({
            region: 'sa-east-1',
            credentials: {accessKeyId: 'AKIA', secretAccessKey: 'secret'},
        });
        expect(SendEmailCommand).toHaveBeenCalledWith({
            FromEmailAddress: 'no-reply@clinic.com',
            ReplyToAddresses: ['contato@clinic.com'],
            Destination: {ToAddresses: ['maria@example.com']},
            Content: {
                Simple: {
                    Subject: {Data: 'Lembrete', Charset: SES_CHARSET},
                    Body: {
                        Html: {Data: toHtmlBody('Olá, <Maria>!'), Charset: SES_CHARSET},
                        Text: {Data: 'Olá, <Maria>!', Charset: SES_CHARSET},
                    },
                },
            },
        });
    });

    it('should fall back to the default AWS credential chain without static keys', async () => {
        sendMock.mockResolvedValue({MessageId: 'ses-2'});

        await makeProvider({fromAddress: 'no-reply@clinic.com'}).send({clinicId, to: 'a@b.com', message: 'Oi'});

        expect(SESv2ClientMock).toHaveBeenCalledWith({region: 'sa-east-1', credentials: undefined});
    });

    it('should return a failure instead of throwing when SES rejects the message', async () => {
        const error = new Error('Email address is not verified.');

        error.name = 'MessageRejected';
        sendMock.mockRejectedValue(error);

        await expect(
            makeProvider({fromAddress: 'no-reply@clinic.com'}).send({clinicId, to: 'a@b.com', message: 'Oi'})
        ).resolves.toEqual({
            success: false,
            error: 'SES request failed: MessageRejected: Email address is not verified.',
        });
    });

    it('should return a failure when no sender is configured', async () => {
        await expect(makeProvider({}).send({clinicId, to: 'a@b.com', message: 'Oi'})).resolves.toEqual({
            success: false,
            error: 'E-mail sender (MAIL_FROM_ADDRESS) is not configured',
        });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it('should build an HTML body that keeps paragraphs and line breaks', () => {
        expect(toHtmlBody('Linha 1\nLinha 2\n\nTchau & até')).toBe(
            '<!doctype html><html><body><p>Linha 1<br>Linha 2</p><p>Tchau &amp; até</p></body></html>'
        );
    });
});
