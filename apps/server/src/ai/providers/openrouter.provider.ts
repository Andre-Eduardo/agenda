import {Injectable, Logger} from '@nestjs/common';
import type {IAiProvider, AiChatParams, AiChatResponse, AiStreamChunk} from './ai-provider.interface';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

type OpenRouterApiResponse = {
    id?: string;
    model?: string;
    choices?: Array<{
        message?: {role: string; content: string | null};
        finish_reason?: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    error?: {message: string; type?: string; code?: number | string};
};

/**
 * Adapter de integração com OpenRouter como provider de IA.
 *
 * OpenRouter expõe API compatível com OpenAI. Model IDs seguem o formato
 * provider/model-name (ex: anthropic/claude-sonnet-4, openai/gpt-4o).
 *
 * ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
 * OPENROUTER_API_KEY      — obrigatório
 * OPENROUTER_BASE_URL     — padrão: https://openrouter.ai/api/v1
 * OPENROUTER_APP_NAME     — valor do header X-Title
 * OPENROUTER_APP_URL      — valor do header HTTP-Referer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Nenhum serviço fora de src/ai/providers/ deve importar esta classe diretamente.
 * Injete via token AI_PROVIDER.
 */
@Injectable()
export class OpenRouterProvider implements IAiProvider {
    private readonly logger = new Logger(OpenRouterProvider.name);

    readonly providerId = 'openrouter';

    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly appName: string;
    private readonly appUrl: string | null;

    constructor() {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error(
                '[OpenRouterProvider] OPENROUTER_API_KEY não configurada. ' +
                    'Defina a variável de ambiente para ativar o provider real.',
            );
        }
        this.apiKey = apiKey;
        this.baseUrl = process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL;
        this.appName = process.env.OPENROUTER_APP_NAME ?? 'Agenda — Chat Clínico';
        this.appUrl = process.env.OPENROUTER_APP_URL ?? null;
    }

    async chat(params: AiChatParams): Promise<AiChatResponse> {
        const messages = params.systemPrompt
            ? [{role: 'system', content: params.systemPrompt}, ...params.messages]
            : params.messages;

        const body: Record<string, unknown> = {
            model: params.modelId,
            messages,
            ...(params.maxTokens !== undefined && {max_tokens: params.maxTokens}),
            ...(params.temperature !== undefined && {temperature: params.temperature}),
            ...params.providerOptions,
        };

        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': this.appName,
        };
        if (this.appUrl) {
            headers['HTTP-Referer'] = this.appUrl;
        }

        this.logger.debug(
            `OpenRouter chat — model: ${params.modelId}, messages: ${messages.length}`,
        );

        let raw: OpenRouterApiResponse;

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            raw = (await response.json()) as OpenRouterApiResponse;

            if (!response.ok) {
                const msg = raw.error?.message ?? `HTTP ${response.status}`;
                this.logger.error(`OpenRouter API error: ${msg}`, {model: params.modelId});
                throw new Error(`OpenRouter API error: ${msg}`);
            }
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('OpenRouter API error:')) {
                throw error;
            }
            const msg = error instanceof Error ? error.message : 'Network error';
            this.logger.error(`OpenRouter fetch failed: ${msg}`);
            throw new Error(`OpenRouter fetch failed: ${msg}`);
        }

        const choice = raw.choices?.[0];
        if (!choice) {
            throw new Error('OpenRouter returned no choices in response.');
        }

        const usage = raw.usage;

        this.logger.debug(
            `OpenRouter reply — finish_reason: ${choice.finish_reason ?? 'stop'}, tokens: ${usage?.total_tokens ?? 'N/A'}`,
        );

        return {
            content: choice.message?.content ?? '',
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
            totalTokens: usage?.total_tokens ?? 0,
            modelId: raw.model ?? params.modelId,
            providerId: 'openrouter',
            rawResponse: raw,
        };
    }

    async *stream(params: AiChatParams): AsyncIterable<AiStreamChunk> {
        // Streaming não implementado neste adapter — delega ao chat não-streaming
        const response = await this.chat(params);
        yield {delta: response.content, done: true};
    }
}
