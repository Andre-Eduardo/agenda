import {Injectable, Logger} from '@nestjs/common';
import type {ClinicId} from '@domain/clinic/entities';
import {EnvConfigService} from '@infrastructure/config';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {
    EVOLUTION_WEBHOOK_TOKEN_HEADER,
    signEvolutionWebhookToken,
} from '@infrastructure/whatsapp/evolution-webhook-token';
import {instanceNameOf} from './whatsapp-instance';

const API_PREFIX = '/api/v1';

/**
 * Points the clinic's Evolution instance at the delivery-tracking webhook (L2-04), with the
 * clinic's HMAC token as a header. Runs on instance creation and on every reconnection, so an
 * instance created before the secret existed catches up. Never fails the caller: without the
 * webhook, reminders are still sent; only their delivery status is not tracked.
 */
@Injectable()
export class ConfigureWhatsAppWebhookService {
    private readonly logger = new Logger(ConfigureWhatsAppWebhookService.name);

    constructor(
        private readonly config: EnvConfigService,
        private readonly client: EvolutionApiClient
    ) {}

    webhookUrlFor(clinicId: ClinicId): string {
        const base = this.config.evolutionApi.webhookBaseUrl || this.config.storage.publicBaseUrl;

        return `${base.replace(/\/+$/, '')}${API_PREFIX}/webhooks/evolution/${clinicId.toString()}`;
    }

    async configure(clinicId: ClinicId): Promise<void> {
        const secret = this.config.evolutionApi.webhookSecret;

        if (!secret) return;

        try {
            await this.client.setWebhook(instanceNameOf(clinicId), {
                url: this.webhookUrlFor(clinicId),
                events: ['MESSAGES_UPDATE', 'MESSAGES_UPSERT'],
                headers: {[EVOLUTION_WEBHOOK_TOKEN_HEADER]: signEvolutionWebhookToken(secret, clinicId)},
            });
        } catch (error) {
            this.logger.error(`Failed to configure the WhatsApp webhook of clinic ${clinicId.toString()}`, error);
        }
    }
}
