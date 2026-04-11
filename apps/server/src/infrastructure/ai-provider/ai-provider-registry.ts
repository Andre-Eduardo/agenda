import {Inject, Injectable} from '@nestjs/common';
import {AiProviderRegistry} from '../../domain/clinical-chat/ports/ai-provider-registry.port';
import type {ChatModelProvider} from '../../domain/clinical-chat/ports/chat-model.provider';
import type {EmbeddingProvider} from '../../domain/clinical-chat/ports/embedding.provider';
import {CHAT_MODEL_PROVIDER_TOKEN, EMBEDDING_PROVIDER_TOKEN} from './ai-provider.tokens';

/**
 * Implementação padrão do registry de providers de IA.
 *
 * Recebe os providers via injeção de dependência pelos tokens abstratos,
 * permitindo que qualquer implementação seja plugada sem alterar esta classe.
 *
 * Para múltiplos providers com fallback automático, estenda esta classe
 * ou crie uma implementação alternativa de `AiProviderRegistry`.
 */
@Injectable()
export class DefaultAiProviderRegistry implements AiProviderRegistry {
    constructor(
        @Inject(CHAT_MODEL_PROVIDER_TOKEN)
        private readonly chatProvider: ChatModelProvider,
        @Inject(EMBEDDING_PROVIDER_TOKEN)
        private readonly embeddingProvider: EmbeddingProvider
    ) {}

    getChatProvider(): ChatModelProvider {
        return this.chatProvider;
    }

    getEmbeddingProvider(): EmbeddingProvider {
        return this.embeddingProvider;
    }

    listRegisteredProviders(): string[] {
        return [
            `chat:${this.chatProvider.providerId}/${this.chatProvider.modelId}`,
            `embedding:${this.embeddingProvider.providerId}`,
        ];
    }

    async healthCheckAll(): Promise<Record<string, boolean>> {
        const [chatHealth, embeddingHealth] = await Promise.all([
            this.chatProvider.healthCheck(),
            this.embeddingProvider.healthCheck(),
        ]);

        return {
            [`chat:${this.chatProvider.providerId}`]: chatHealth.healthy,
            [`embedding:${this.embeddingProvider.providerId}`]: embeddingHealth.healthy,
        };
    }
}
