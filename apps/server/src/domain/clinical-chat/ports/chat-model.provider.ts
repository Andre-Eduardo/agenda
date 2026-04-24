/**
 * Tipos e contrato abstrato para provedores de modelo de linguagem (LLM).
 *
 * ─── COMO PLUGAR UM PROVIDER REAL ───────────────────────────────────────────
 * 1. Crie o arquivo em `infrastructure/ai-provider/` implementando esta interface
 *    Ex: `OpenAiChatProvider`, `AnthropicChatProvider`, `OpenRouterChatProvider`
 * 2. Registre no `AiProviderModule` com o token `CHAT_MODEL_PROVIDER_TOKEN`
 * 3. Configure as credenciais via variáveis de ambiente (.env)
 * 4. O `SendChatMessageService` não precisa de nenhuma alteração — depende apenas desta interface
 *
 * Providers planejados:
 * - OpenAI: `npm install openai` → models: gpt-4o, gpt-4-turbo
 * - Anthropic: `npm install @anthropic-ai/sdk` → models: claude-3-5-sonnet, claude-3-opus
 * - OpenRouter: API OpenAI-compatible → acesso a centenas de modelos
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ChatMessage =
    | {role: 'system' | 'user' | 'assistant'; content: string}
    | {role: 'tool'; content: string; toolCallId: string};

/** JSON Schema object describing a tool parameter. */
export type LLMToolDefinition = {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema object
};

export type LLMToolCall = {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
};

export type ChatReplyInput = {
    messages: ChatMessage[];
    /** Tokens máximos para geração (provider pode ignorar se não suportado) */
    maxTokens?: number;
    /** Temperatura 0–1 (provider pode ignorar se não suportado) */
    temperature?: number;
    /** Sequências de parada */
    stop?: string[];
    /**
     * Sobrescreve o modelo padrão do provider para esta chamada específica.
     * Usado pelo SendChatMessageService para aplicar o modelo do AgentProfile.
     * O valor "openrouter/auto" é bloqueado — o provider lançará erro se receber esse valor.
     */
    modelOverride?: string;
    /** Tool definitions exposed to the model. */
    tools?: LLMToolDefinition[];
    /** "auto" lets the model decide; "none" disables tool use. */
    toolChoice?: 'auto' | 'none';
};

export type ChatReplyOutput = {
    content: string;
    /** 'tool_use' when the model requested one or more tool calls. */
    finishReason: 'stop' | 'length' | 'error' | 'tool_use' | string;
    usage: {
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
    };
    /** Populated when finishReason is 'tool_use'. */
    toolCalls?: LLMToolCall[];
    /** Resposta bruta do provider para debug/auditoria */
    rawResponse?: unknown;
};

export type UsageEstimate = {
    estimatedPromptTokens: number;
    estimatedCompletionTokens: number;
    estimatedTotalTokens: number;
};

export type ProviderCapabilities = {
    supportsStreaming: boolean;
    supportsStructuredOutput: boolean;
    maxContextTokens: number;
    defaultMaxTokens: number;
};

export type HealthCheckResult = {
    healthy: boolean;
    latencyMs?: number;
    message?: string;
};

/**
 * Contrato abstrato para provedores de modelo de linguagem.
 * Nenhum serviço de negócio deve importar SDKs de IA diretamente —
 * toda comunicação com LLMs passa por esta interface.
 */
export interface ChatModelProvider {
    /** Identificador único do provider (ex: "openai", "anthropic", "mock") */
    readonly providerId: string;
    /** ID/nome do modelo configurado (ex: "gpt-4o", "claude-3-5-sonnet-20241022") */
    readonly modelId: string;

    /**
     * Gera uma resposta de chat a partir de um conjunto de mensagens.
     * Principal método para o fluxo de chat clínico.
     */
    generateChatReply(input: ChatReplyInput): Promise<ChatReplyOutput>;

    /**
     * Estima uso de tokens antes de enviar a requisição.
     * Útil para controle de custo e validação de tamanho do contexto.
     */
    estimateUsage(input: ChatReplyInput): Promise<UsageEstimate>;

    /** Retorna as capacidades declaradas deste provider. */
    listCapabilities(): ProviderCapabilities;

    /** Verifica se o provider está disponível e respondendo. */
    healthCheck(): Promise<HealthCheckResult>;
}

/** Token abstrato para injeção de dependência no NestJS */
export abstract class ChatModelProvider {}
