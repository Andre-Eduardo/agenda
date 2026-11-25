import {ConfigService} from '@nestjs/config';
import {EnvConfigService, type EnvConfig} from '@infrastructure/config';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {EvolutionWhatsAppProvider} from '../evolution-whatsapp.provider';
import {notificationProvidersFactory} from '../notification-providers.factory';
import {SesEmailProvider} from '../ses-email.provider';
import {StubEmailProvider} from '../stub-email.provider';
import {StubSmsProvider} from '../stub-sms.provider';
import {StubWhatsAppProvider} from '../stub-whatsapp.provider';

function select(config: Partial<EnvConfig>) {
    const env = new EnvConfigService(new ConfigService({mail: {}, evolutionApi: {}, ...config}));

    const client = new EvolutionApiClient(env);

    return notificationProvidersFactory(
        env,
        client,
        new EvolutionWhatsAppProvider(client),
        new StubWhatsAppProvider(),
        new SesEmailProvider(env),
        new StubEmailProvider(),
        new StubSmsProvider()
    );
}

describe('The notification providers factory', () => {
    it('should default every channel to the stubs', () => {
        const providers = select({});

        expect(providers[0]).toBeInstanceOf(StubWhatsAppProvider);
        expect(providers[1]).toBeInstanceOf(StubEmailProvider);
        expect(providers[2]).toBeInstanceOf(StubSmsProvider);
    });

    it('should use the real providers when they are configured', () => {
        const providers = select({
            evolutionApi: {url: 'http://evo', apiKey: 'key', timeoutMs: 10_000},
            mail: {fromAddress: 'no-reply@clinic.com', region: 'sa-east-1'},
        });

        expect(providers[0]).toBeInstanceOf(EvolutionWhatsAppProvider);
        expect(providers[1]).toBeInstanceOf(SesEmailProvider);
        expect(providers[2]).toBeInstanceOf(StubSmsProvider);
    });
});
