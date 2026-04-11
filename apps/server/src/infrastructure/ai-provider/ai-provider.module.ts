import {Module} from '@nestjs/common';
import {AiProviderRegistry} from '../../domain/clinical-chat/ports/ai-provider-registry.port';
import {MockChatProvider} from './mock-chat.provider';
import {MockEmbeddingProvider} from './mock-embedding.provider';
import {DefaultAiProviderRegistry} from './ai-provider-registry';
import {CHAT_MODEL_PROVIDER_TOKEN, EMBEDDING_PROVIDER_TOKEN} from './ai-provider.tokens';
import {OpenRouterChatProvider} from './openrouter-chat.provider';

/**
 * Módulo de providers de IA para o chat clínico.
 *
 * O provider ativo é selecionado pela variável de ambiente `AI_CHAT_PROVIDER`.
 * Quando não configurada, o mock é usado (desenvolvimento local sem API key).
 *
 * ─── VARIÁVEIS DE AMBIENTE ───────────────────────────────────────────────────
 * AI_CHAT_PROVIDER=openrouter        # ativa o OpenRouterChatProvider
 * OPENROUTER_API_KEY=sk-or-...       # chave de API (obrigatória para openrouter)
 * OPENROUTER_MODEL=openai/gpt-4o    # modelo no formato provider/model do OpenRouter
 *
 * ─── COMO ADICIONAR UM NOVO PROVIDER ────────────────────────────────────────
 * 1. Crie a implementação em `infrastructure/ai-provider/` (ex: openai-chat.provider.ts)
 * 2. Adicione um case na factory abaixo com o novo identificador
 * 3. Documente as variáveis de ambiente necessárias aqui e no .env.example
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Module({
    providers: [
        MockChatProvider,
        MockEmbeddingProvider,
        OpenRouterChatProvider,

        // Chat provider: selecionado por AI_CHAT_PROVIDER (padrão: mock)
        {
            provide: CHAT_MODEL_PROVIDER_TOKEN,
            useFactory: (): MockChatProvider | OpenRouterChatProvider => {
                const provider = process.env.AI_CHAT_PROVIDER ?? 'mock';

                if (provider === 'openrouter') {
                    const apiKey = process.env.OPENROUTER_API_KEY;
                    const modelId = process.env.OPENROUTER_MODEL;

                    if (!apiKey) {
                        throw new Error(
                            '[AiProviderModule] OPENROUTER_API_KEY não configurada. ' +
                                'Defina a variável de ambiente ou use AI_CHAT_PROVIDER=mock.'
                        );
                    }
                    if (!modelId) {
                        throw new Error(
                            '[AiProviderModule] OPENROUTER_MODEL não configurada. ' +
                                'Exemplo: OPENROUTER_MODEL=openai/gpt-4o'
                        );
                    }

                    return new OpenRouterChatProvider({apiKey, modelId});
                }

                // Padrão: mock (desenvolvimento sem API key)
                return new MockChatProvider();
            },
        },

        {
            provide: EMBEDDING_PROVIDER_TOKEN,
            useClass: MockEmbeddingProvider,
        },

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
