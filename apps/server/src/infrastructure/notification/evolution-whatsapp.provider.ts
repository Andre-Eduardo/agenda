import {Injectable, Logger} from '@nestjs/common';
import {z} from 'zod';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {EnvConfigService} from '@infrastructure/config';
import {describeError, maskDestination} from '@infrastructure/notification/notification-log.util';

const BRAZIL_COUNTRY_CODE = '55';

/** Subset of the Evolution API `POST /message/sendText/{instance}` response we rely on. */
const sendTextResponseSchema = z.object({
    key: z.object({id: z.string().optional()}).optional(),
});

/**
 * WhatsApp adapter backed by the Evolution API (https://doc.evolution-api.com), the same
 * provider used by plexter.
 *
 * Instance selection: `EVOLUTION_INSTANCE_NAME` when set (one shared number for every clinic),
 * otherwise the clinic id — the plexter convention of one instance per tenant, created and
 * paired in the Evolution manager under the clinic id.
 */
@Injectable()
export class EvolutionWhatsAppProvider extends NotificationProvider {
    readonly channel = ReminderChannel.WHATSAPP;

    private readonly logger = new Logger(EvolutionWhatsAppProvider.name);

    constructor(private readonly config: EnvConfigService) {
        super();
    }

    static isConfigured(config: EnvConfigService): boolean {
        const {url, apiKey} = config.evolutionApi;

        return Boolean(url && apiKey);
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
        const {url, apiKey, instanceName, timeoutMs} = this.config.evolutionApi;

        if (!url || !apiKey) {
            return {success: false, error: 'Evolution API is not configured'};
        }

        const instance = instanceName ?? payload.clinicId.toString();
        const number = EvolutionWhatsAppProvider.toWhatsAppNumber(payload.to);
        const endpoint = `${url.replace(/\/+$/, '')}/message/sendText/${encodeURIComponent(instance)}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', apikey: apiKey},
                body: JSON.stringify({number, text: payload.message}),
                signal: AbortSignal.timeout(timeoutMs),
            });

            if (!response.ok) {
                const body = await response.text();
                const error = `Evolution API error ${response.status}: ${body.slice(0, 500)}`;

                this.logger.warn(`WhatsApp to ${maskDestination(number)} failed (instance ${instance}): ${error}`);

                return {success: false, error};
            }

            const parsed = sendTextResponseSchema.safeParse(await response.json());

            return {success: true, providerId: parsed.success ? parsed.data.key?.id : undefined};
        } catch (error) {
            const message = `Evolution API request failed: ${describeError(error)}`;

            this.logger.warn(`WhatsApp to ${maskDestination(number)} failed (instance ${instance}): ${message}`);

            return {success: false, error: message};
        }
    }
}
