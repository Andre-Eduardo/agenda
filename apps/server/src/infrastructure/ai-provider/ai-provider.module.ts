import {Module} from '@nestjs/common';
import {AiProviderRegistry} from '../../domain/clinical-chat/ports/ai-provider-registry.port';
import {MockChatProvider} from './mock-chat.provider';
import {MockEmbeddingProvider} from './mock-embedding.provider';
import {OpenAiEmbeddingProvider} from './openai-embedding.provider';
import {DefaultAiProviderRegistry} from './ai-provider-registry';
import {CHAT_MODEL_PROVIDER_TOKEN, EMBEDDING_PROVIDER_TOKEN} from './ai-provider.tokens';
import {OpenRouterChatProvider} from './openrouter-chat.provider';

/**
 * Módulo de providers de IA para o chat clínico.
 *
 * Chat e embeddings são provisionados por tokens independentes, garantindo que
 * trocar o modelo de chat não exige reindexação dos embeddings.
 *
 * ─── VARIÁVEIS DE AMBIENTE ───────────────────────────────────────────────────
 * AI_CHAT_PROVIDER=openrouter        # ativa o OpenRouterChatProvider
 * OPENROUTER_API_KEY=sk-or-...       # chave de API do OpenRouter
 * OPENROUTER_MODEL=openai/gpt-4o    # modelo no formato provider/model do OpenRouter
 *
 * AI_EMBEDDING_PROVIDER=openai       # ativa o OpenAiEmbeddingProvider
 * OPENAI_API_KEY=sk-...              # chave de API da OpenAI
 * OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # modelo de embeddings (opcional)
 *
 * ─── COMO ADICIONAR UM NOVO PROVIDER ────────────────────────────────────────
 * 1. Crie a implementação em `infrastructure/ai-provider/`
 * 2. Adicione um case na factory abaixo com o novo identificador
 * 3. Documente as variáveis de ambiente necessárias aqui e no .env.example
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Module({
    providers: [
        MockChatProvider,
        MockEmbeddingProvider,

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

        // Embedding provider: selecionado por AI_EMBEDDING_PROVIDER (padrão: mock)
        // Separado do ChatProvider — trocar o modelo de chat nunca exige reindexação.
        {
            provide: EMBEDDING_PROVIDER_TOKEN,
            useFactory: (): MockEmbeddingProvider | OpenAiEmbeddingProvider => {
                const provider = process.env.AI_EMBEDDING_PROVIDER ?? 'mock';

                if (provider === 'openai') {
                    const apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        throw new Error(
                            '[AiProviderModule] OPENAI_API_KEY não configurada. ' +
                                'Defina a variável de ambiente ou use AI_EMBEDDING_PROVIDER=mock.'
                        );
                    }
                    return new OpenAiEmbeddingProvider({
                        apiKey,
                        model: process.env.OPENAI_EMBEDDING_MODEL,
                    });
                }

                // Padrão: mock (desenvolvimento sem API key — vetores aleatórios)
                return new MockEmbeddingProvider();
            },
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
