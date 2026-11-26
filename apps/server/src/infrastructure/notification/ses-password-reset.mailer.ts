import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';
import {Injectable, Logger} from '@nestjs/common';
import type {PasswordResetEmail, PasswordResetMailer} from '@domain/user/password-reset-mailer';
import {EnvConfigService} from '@infrastructure/config';
import {describeError, maskDestination} from '@infrastructure/notification/notification-log.util';
import {SES_CHARSET, toHtmlBody} from '@infrastructure/notification/ses-email.provider';

const SUBJECT = 'Redefinição de senha';

export function buildPasswordResetMessage({name, resetUrl, expiresInMinutes}: PasswordResetEmail): string {
    return [
        `Olá, ${name}.`,
        'Recebemos um pedido para redefinir a senha da sua conta na Agenda Saúde. Para escolher uma nova senha, acesse o link abaixo:',
        resetUrl,
        `O link vale por ${expiresInMinutes} minutos e só pode ser usado uma vez.`,
        'Se você não fez esse pedido, ignore este e-mail. Sua senha atual continua valendo.',
    ].join('\n\n');
}

/**
 * Sends the password-reset e-mail through Amazon SES, with the same sender settings as the
 * reminder e-mails (`MAIL_FROM_ADDRESS`, `MAIL_SES_*`). Without `MAIL_FROM_ADDRESS` nothing is
 * sent; outside production the link is logged so local setups can still reset passwords.
 */
@Injectable()
export class SesPasswordResetMailer implements PasswordResetMailer {
    private readonly logger = new Logger(SesPasswordResetMailer.name);

    private client: SESv2Client | null = null;

    constructor(private readonly config: EnvConfigService) {}

    async send(email: PasswordResetEmail): Promise<boolean> {
        const {fromAddress, replyTo, region, accessKeyId, secretAccessKey} = this.config.mail;
        const message = buildPasswordResetMessage(email);

        if (!fromAddress) {
            if (this.config.isProd) {
                this.logger.error('Password reset e-mail not sent: MAIL_FROM_ADDRESS is not configured.');
            } else {
                this.logger.warn(`MAIL_FROM_ADDRESS not set; password reset link for ${maskDestination(email.to)}: ${email.resetUrl}`);
            }

            return false;
        }

        this.client ??= new SESv2Client({
            region,
            credentials: accessKeyId && secretAccessKey ? {accessKeyId, secretAccessKey} : undefined,
        });

        try {
            await this.client.send(
                new SendEmailCommand({
                    FromEmailAddress: fromAddress,
                    ReplyToAddresses: replyTo ? [replyTo] : undefined,
                    Destination: {ToAddresses: [email.to]},
                    Content: {
                        Simple: {
                            Subject: {Data: SUBJECT, Charset: SES_CHARSET},
                            Body: {
                                Html: {Data: toHtmlBody(message), Charset: SES_CHARSET},
                                Text: {Data: message, Charset: SES_CHARSET},
                            },
                        },
                    },
                })
            );

            return true;
        } catch (error) {
            this.logger.warn(`Password reset e-mail to ${maskDestination(email.to)} failed: ${describeError(error)}`);

            return false;
        }
    }
}
