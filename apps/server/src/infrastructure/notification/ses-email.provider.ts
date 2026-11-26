import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';
import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {EnvConfigService} from '@infrastructure/config';
import {describeError, maskDestination} from '@infrastructure/notification/notification-log.util';

// SES expects the IANA charset name.
// oxlint-disable-next-line unicorn/text-encoding-identifier-case
export const SES_CHARSET = 'UTF-8';
const DEFAULT_SUBJECT = 'Lembrete de consulta';

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escapeHtml(value: string): string {
    return value.replaceAll(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Plain-text message → minimal HTML body (paragraphs and line breaks preserved). */
export function toHtmlBody(message: string): string {
    const paragraphs = message
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
        .join('');

    return `<!doctype html><html><body>${paragraphs}</body></html>`;
}

/**
 * E-mail adapter backed by Amazon SES v2, the same provider used by plexter. Enabled when
 * `MAIL_FROM_ADDRESS` is set; without static keys the default AWS credential chain
 * (instance/task role) is used.
 */
@Injectable()
export class SesEmailProvider extends NotificationProvider {
    readonly channel = ReminderChannel.EMAIL;

    private readonly logger = new Logger(SesEmailProvider.name);
    private client: SESv2Client | null = null;

    constructor(private readonly config: EnvConfigService) {
        super();
    }

    static isConfigured(config: EnvConfigService): boolean {
        return Boolean(config.mail.fromAddress);
    }

    private getClient(): SESv2Client {
        if (this.client === null) {
            const {region, accessKeyId, secretAccessKey} = this.config.mail;

            this.client = new SESv2Client({
                region,
                credentials: accessKeyId && secretAccessKey ? {accessKeyId, secretAccessKey} : undefined,
            });
        }

        return this.client;
    }

    async send(payload: NotificationPayload): Promise<NotificationResult> {
        const {fromAddress, replyTo, configurationSet} = this.config.mail;

        if (!fromAddress) {
            return {success: false, error: 'E-mail sender (MAIL_FROM_ADDRESS) is not configured'};
        }

        try {
            const output = await this.getClient().send(
                new SendEmailCommand({
                    FromEmailAddress: fromAddress,
                    ReplyToAddresses: replyTo ? [replyTo] : undefined,
                    // The configuration set publishes delivery/bounce/open events to SNS (L2-04).
                    ConfigurationSetName: configurationSet || undefined,
                    Destination: {ToAddresses: [payload.to]},
                    Content: {
                        Simple: {
                            Subject: {Data: payload.subject ?? DEFAULT_SUBJECT, Charset: SES_CHARSET},
                            Body: {
                                Html: {Data: toHtmlBody(payload.message), Charset: SES_CHARSET},
                                Text: {Data: payload.message, Charset: SES_CHARSET},
                            },
                        },
                    },
                })
            );

            return {success: true, providerId: output.MessageId};
        } catch (error) {
            const message = `SES request failed: ${describeError(error)}`;

            this.logger.warn(`E-mail to ${maskDestination(payload.to)} failed: ${message}`);

            return {success: false, error: message};
        }
    }
}
