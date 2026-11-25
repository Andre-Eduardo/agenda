import type {NotificationProvider} from '@domain/notification/ports/notification-provider.port';
import {EnvConfigService} from '@infrastructure/config';
import {EvolutionWhatsAppProvider} from '@infrastructure/notification/evolution-whatsapp.provider';
import {SesEmailProvider} from '@infrastructure/notification/ses-email.provider';
import {StubEmailProvider} from '@infrastructure/notification/stub-email.provider';
import {StubSmsProvider} from '@infrastructure/notification/stub-sms.provider';
import {StubWhatsAppProvider} from '@infrastructure/notification/stub-whatsapp.provider';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';

/**
 * Selects one provider per channel from the environment, defaulting to the stubs so local
 * development and tests never send real messages (same default-to-mock behavior as the
 * payment and AI providers):
 * - WhatsApp: Evolution API when `EVOLUTION_SERVER_URL` and `EVOLUTION_AUTHENTICATION_API_KEY` are set;
 * - E-mail: Amazon SES when `MAIL_FROM_ADDRESS` is set;
 * - SMS: stub (no provider selected yet, see docs/notification-providers.md).
 */
export function notificationProvidersFactory(
    config: EnvConfigService,
    evolutionClient: EvolutionApiClient,
    evolutionWhatsApp: EvolutionWhatsAppProvider,
    stubWhatsApp: StubWhatsAppProvider,
    sesEmail: SesEmailProvider,
    stubEmail: StubEmailProvider,
    stubSms: StubSmsProvider
): NotificationProvider[] {
    return [
        evolutionClient.isEnabled ? evolutionWhatsApp : stubWhatsApp,
        SesEmailProvider.isConfigured(config) ? sesEmail : stubEmail,
        stubSms,
    ];
}

export const NOTIFICATION_PROVIDER_FACTORY_PROVIDERS = [
    EvolutionApiClient,
    EvolutionWhatsAppProvider,
    StubWhatsAppProvider,
    SesEmailProvider,
    StubEmailProvider,
    StubSmsProvider,
] as const;
