import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {describeError, maskDestination} from '@infrastructure/notification/notification-log.util';
import {EvolutionApiClient, EvolutionApiError} from '@infrastructure/whatsapp/evolution-api.client';

const BRAZIL_COUNTRY_CODE = '55';

/**
 * WhatsApp adapter backed by the Evolution API, the same provider used by plexter.
 *
 * Each clinic sends from its own instance, named after the clinic id and paired from the
 * WhatsApp settings screen (`/whatsapp-config`).
 */
@Injectable()
export class EvolutionWhatsAppProvider extends NotificationProvider {
    readonly channel = ReminderChannel.WHATSAPP;

    private readonly logger = new Logger(EvolutionWhatsAppProvider.name);

    constructor(private readonly client: EvolutionApiClient) {
        super();
    }

    /**
     * Evolution expects the full international number, digits only. Brazilian numbers are often
     * stored without the country code (DDD + number: 10 or 11 digits), so it is prefixed here,
     * unless the number is explicitly international (starts with `+`).
     */
    static toWhatsAppNumber(phone: string): string {
        const digits = phone.replaceAll(/\D/g, '');
        const international = phone.trim().startsWith('+');

        if (!international && (digits.length === 10 || digits.length === 11)) {
            return `${BRAZIL_COUNTRY_CODE}${digits}`;
        }

        return digits;
    }

    async send(payload: NotificationPayload): Promise<NotificationResult> {
        const instance = payload.clinicId.toString();
        const number = EvolutionWhatsAppProvider.toWhatsAppNumber(payload.to);

        try {
            const providerId = await this.client.sendText(instance, number, payload.message);

            return {success: true, providerId};
        } catch (error) {
            const message =
                error instanceof EvolutionApiError
                    ? error.message
                    : `Evolution API request failed: ${describeError(error)}`;

            this.logger.warn(`WhatsApp to ${maskDestination(number)} failed (instance ${instance}): ${message}`);

            return {success: false, error: message};
        }
    }
}
