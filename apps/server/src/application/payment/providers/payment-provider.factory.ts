import {AsaasPaymentAdapter} from '@application/payment/providers/asaas.adapter';
import {MockPaymentProvider} from '@application/payment/providers/mock-payment.adapter';
import type {IPaymentProvider} from '@application/payment/providers/payment-provider.interface';
import {EnvConfigService} from '@infrastructure/config';

/**
 * Selects the IPaymentProvider implementation for the app: the real Asaas adapter when
 * ASAAS_API_KEY is configured, otherwise the deterministic mock — same default-to-mock
 * behavior as AI_CHAT_PROVIDER/AI_EMBEDDING_PROVIDER in infrastructure/ai-provider,
 * so subscription activation/plan-change/addon-purchase work locally without credentials.
 */
export function paymentProviderFactory(
    configService: EnvConfigService,
    asaasAdapter: AsaasPaymentAdapter,
    mockProvider: MockPaymentProvider
): IPaymentProvider {
    return configService.asaas.apiKey ? asaasAdapter : mockProvider;
}

export const PAYMENT_PROVIDER_FACTORY_PROVIDERS = [AsaasPaymentAdapter, MockPaymentProvider] as const;
