import {Module} from '@nestjs/common';
import {AiProviderRegistry} from '../../domain/clinical-chat/ports/ai-provider-registry.port';
import {MockChatProvider} from './mock-chat.provider';
import {MockEmbeddingProvider} from './mock-embedding.provider';
import {DefaultAiProviderRegistry} from './ai-provider-registry';
import {CHAT_MODEL_PROVIDER_TOKEN, EMBEDDING_PROVIDER_TOKEN} from './ai-provider.tokens';

/**
 * Módulo de providers de IA para o chat clínico.
 *
 * AMBIENTE ATUAL: providers mock (desenvolvimento) — nenhuma API externa necessária.
 *
 * ─── COMO ATIVAR UM PROVIDER REAL ───────────────────────────────────────────
 * Substitua os providers abaixo pelo provider real correspondente:
 *
 * Opção 1 — Troca direta:
 * { provide: CHAT_MODEL_PROVIDER_TOKEN, useClass: OpenAiChatProvider }
 *
 * Opção 2 — Seleção por variável de ambiente (recomendado para multi-env):
 * {
 *   provide: CHAT_MODEL_PROVIDER_TOKEN,
 *   useFactory: (config: ConfigService) => {
 *     switch (config.get<string>('AI_CHAT_PROVIDER', 'mock')) {
 *       case 'openai':     return new OpenAiChatProvider(config);
 *       case 'anthropic':  return new AnthropicChatProvider(config);
 *       case 'openrouter': return new OpenRouterChatProvider(config);
 *       default:           return new MockChatProvider();
 *     }
 *   },
 *   inject: [ConfigService],
 * }
 *
 * Variáveis de ambiente esperadas (quando provider real for ativado):
 * - AI_CHAT_PROVIDER=openai|anthropic|openrouter
 * - AI_CHAT_MODEL=gpt-4o|claude-3-5-sonnet-20241022|...
 * - OPENAI_API_KEY=sk-...
 * - ANTHROPIC_API_KEY=sk-ant-...
 * - OPENROUTER_API_KEY=sk-or-...
 * - AI_EMBEDDING_PROVIDER=openai|mock
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Module({
    providers: [
        // Implementações concretas (mock por padrão — substituir quando necessário)
        MockChatProvider,
        MockEmbeddingProvider,

        // Tokens de DI: permitem injeção por interface sem depender da implementação
        {
            provide: CHAT_MODEL_PROVIDER_TOKEN,
            useClass: MockChatProvider,
        },
        {
            provide: EMBEDDING_PROVIDER_TOKEN,
            useClass: MockEmbeddingProvider,
        },

        // Registry unificado — expose para os services via AiProviderRegistry token
        {
            provide: AiProviderRegistry,
            useClass: DefaultAiProviderRegistry,
        },
    ],
    exports: [
        CHAT_MODEL_PROVIDER_TOKEN,
        EMBEDDING_PROVIDER_TOKEN,
        AiProviderRegistry,
    ],
})
export class AiProviderModule {}
