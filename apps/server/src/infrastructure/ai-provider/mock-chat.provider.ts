import {Injectable} from '@nestjs/common';
import type {
    ChatModelProvider,
    ChatReplyInput,
    ChatReplyOutput,
    UsageEstimate,
    ProviderCapabilities,
    HealthCheckResult,
} from '../../domain/clinical-chat/ports/chat-model.provider';

/**
 * Provider mock de LLM para desenvolvimento e testes end-to-end.
 *
 * Gera respostas determinísticas e simuladas sem chamar APIs externas.
 * Permite testar o fluxo completo do chat clínico sem credenciais reais.
 *
 * ─── COMO SUBSTITUIR POR UM PROVIDER REAL ───────────────────────────────────
 * 1. Crie ex: `infrastructure/ai-provider/openai-chat.provider.ts`
 *    implementando `ChatModelProvider`
 * 2. Em `AiProviderModule`, troque:
 *    `{ provide: CHAT_MODEL_PROVIDER_TOKEN, useClass: MockChatProvider }`
 *    por:
 *    `{ provide: CHAT_MODEL_PROVIDER_TOKEN, useClass: OpenAiChatProvider }`
 * 3. Configure as variáveis de ambiente necessárias
 * 4. Nenhum serviço de negócio precisa ser alterado
 *
 * Providers concretos planejados:
 * - `OpenAiChatProvider` — SDK: `npm install openai`
 * - `AnthropicChatProvider` — SDK: `npm install @anthropic-ai/sdk`
 * - `OpenRouterChatProvider` — API OpenAI-compatible
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class MockChatProvider implements ChatModelProvider {
    readonly providerId = 'mock';
    readonly modelId = 'mock-clinical-assistant-v1';

    async generateChatReply(input: ChatReplyInput): Promise<ChatReplyOutput> {
        const lastUserMessage = input.messages.filter((m) => m.role === 'user').at(-1);
        const questionPreview = lastUserMessage?.content?.slice(0, 100) ?? '(sem mensagem)';
        const isTruncated = (lastUserMessage?.content?.length ?? 0) > 100;

        // Simula latência de um LLM real (200–600ms)
        await this.simulateLatency(200, 600);

        const systemMessage = input.messages.find((m) => m.role === 'system');
        const hasContext = systemMessage && (systemMessage as {role: 'system'; content: string}).content.length > 50;
        const hasTools = input.tools && input.tools.length > 0;

        const content = [
            `[ASSISTENTE CLÍNICO — MODO DESENVOLVIMENTO]`,
            ``,
            `Esta é uma resposta simulada gerada pelo provider mock.`,
            `O provider real ainda não está configurado.`,
            ``,
            `Pergunta recebida:`,
            `"${questionPreview}${isTruncated ? '...' : ''}"`,
            ``,
            hasContext
                ? `Contexto clínico detectado: ${(systemMessage as {role: 'system'; content: string}).content.length} caracteres de contexto injetado.`
                : `Nenhum contexto clínico detectado no sistema.`,
            ...(hasTools ? [``, `${input.tools!.length} ferramenta(s) disponível(is): ${input.tools!.map((t) => t.name).join(', ')}.`] : []),
            ``,
            `Para ativar um provider real, consulte:`,
            `infrastructure/ai-provider/ai-provider.tokens.ts`,
            `infrastructure/ai-provider/ai-provider.module.ts`,
        ].join('\n');

        const promptTokens = this.estimateTokenCount(input.messages.map((m) => m.content ?? '').join(' '));
        const completionTokens = Math.ceil(content.length / 4);

        return {
            content,
            finishReason: 'stop',
            usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
            },
            rawResponse: {
                provider: this.providerId,
                model: this.modelId,
                mock: true,
                inputMessages: input.messages.length,
            },
        };
    }

    async estimateUsage(input: ChatReplyInput): Promise<UsageEstimate> {
        const text = input.messages.map((m) => m.content ?? '').join(' ');
        const estimatedPromptTokens = this.estimateTokenCount(text);
        const estimatedCompletionTokens = Math.round(estimatedPromptTokens * 0.3);

        return {
            estimatedPromptTokens,
            estimatedCompletionTokens,
            estimatedTotalTokens: estimatedPromptTokens + estimatedCompletionTokens,
        };
    }

    listCapabilities(): ProviderCapabilities {
        return {
            supportsStreaming: false,
            supportsStructuredOutput: false,
            maxContextTokens: 8192,
            defaultMaxTokens: 1024,
        };
    }

    async healthCheck(): Promise<HealthCheckResult> {
        return {
            healthy: true,
            latencyMs: 0,
            message: 'Mock provider sempre disponível — nenhuma API externa necessária.',
        };
    }

    /** Estimativa simples: ~4 caracteres por token (heurística para textos em português). */
    private estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }

    private async simulateLatency(minMs: number, maxMs: number): Promise<void> {
        const ms = minMs + Math.random() * (maxMs - minMs);
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
