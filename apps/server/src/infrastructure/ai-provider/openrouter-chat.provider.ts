import { Injectable, Logger } from "@nestjs/common";
import type {
  ChatModelProvider,
  ChatReplyInput,
  ChatReplyOutput,
  LLMToolCall,
  UsageEstimate,
  ProviderCapabilities,
  HealthCheckResult,
} from "@domain/clinical-chat/ports/chat-model.provider";

/** Configuração injetada no provider via factory no AiProviderModule */
export type OpenRouterConfig = {
  apiKey: string;
  /** ID completo do modelo no formato aceito pelo OpenRouter (ex: "openai/gpt-4o", "anthropic/claude-3-5-sonnet") */
  modelId: string;
  /** Número máximo de tokens de contexto suportado pelo modelo configurado */
  maxContextTokens?: number;
  /** Tokens máximos padrão para geração quando não especificado pelo caller */
  defaultMaxTokens?: number;
  /** Valor do header X-Title enviado ao OpenRouter (identifica a aplicação) */
  appName?: string;
  /** Valor do header HTTP-Referer enviado ao OpenRouter (URL da aplicação) */
  appUrl?: string;
};

/** Formato da requisição para a API OpenRouter (compatível com OpenAI) */
type OpenRouterRequest = {
  model: string;
  messages: Array<{
    role: string;
    content: string | null;
    tool_call_id?: string;
    tool_calls?: OpenRouterToolCall[];
  }>;
  max_tokens?: number;
  temperature?: number;
  stop?: string[];
  tools?: Array<{
    type: "function";
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }>;
  tool_choice?: "auto" | "none";
};

type OpenRouterToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/** Formato da resposta da API OpenRouter (compatível com OpenAI) */
type OpenRouterResponse = {
  id: string;
  model: string;
  choices: Array<{
    message: { role: string; content: string | null; tool_calls?: OpenRouterToolCall[] };
    finish_reason: string;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type?: string;
    code?: number | string;
  };
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Provider de chat clínico utilizando OpenRouter como camada de roteamento.
 *
 * O OpenRouter expõe uma API compatível com OpenAI, permitindo acesso a centenas
 * de modelos (OpenAI, Anthropic, Google, Meta, etc.) por meio de um endpoint único.
 *
 * ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────
 * Variáveis de ambiente necessárias:
 * - OPENROUTER_API_KEY  — chave de API obtida em https://openrouter.ai/keys
 * - OPENROUTER_MODEL    — ID do modelo no formato "provider/model"
 *                         Ex: "openai/gpt-4o", "anthropic/claude-3-5-sonnet"
 *
 * Ativação em AiProviderModule:
 * { provide: CHAT_MODEL_PROVIDER_TOKEN, useClass: OpenRouterChatProvider }
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class OpenRouterChatProvider implements ChatModelProvider {
  private readonly logger = new Logger(OpenRouterChatProvider.name);

  readonly providerId = "openrouter";
  readonly modelId: string;

  private readonly apiKey: string;
  private readonly maxContextTokens: number;
  private readonly defaultMaxTokens: number;
  private readonly appName: string;
  private readonly appUrl: string | null;

  constructor(config: OpenRouterConfig) {
    if (config.modelId === "openrouter/auto") {
      throw new Error(
        '[OpenRouterChatProvider] O modelo "openrouter/auto" não é permitido. ' +
          "Configure um modelo fixo em OPENROUTER_MODEL ou no providerModelId do AgentProfile.",
      );
    }

    this.apiKey = config.apiKey;
    this.modelId = config.modelId;
    this.maxContextTokens = config.maxContextTokens ?? 128_000;
    this.defaultMaxTokens = config.defaultMaxTokens ?? 1024;
    this.appName = config.appName ?? "Agenda — Chat Clínico Assistivo";
    this.appUrl = config.appUrl ?? null;
  }

  /**
   * Envia o payload de mensagens para o OpenRouter e retorna a resposta mapeada.
   *
   * O array `input.messages` já chega montado pelo SendChatMessageService com:
   * - system message: instruções do AgentProfile + contexto clínico (snapshot + chunks)
   * - histórico recente de USER/ASSISTANT
   * - mensagem atual do usuário
   */
  async generateChatReply(input: ChatReplyInput): Promise<ChatReplyOutput> {
    const effectiveModel = input.modelOverride ?? this.modelId;

    if (effectiveModel === "openrouter/auto") {
      throw new Error(
        '[OpenRouterChatProvider] O modelo "openrouter/auto" não é permitido em fluxos clínicos. ' +
          "Defina um modelo fixo no providerModelId do AgentProfile ou na configuração padrão da especialidade.",
      );
    }

    const requestBody: OpenRouterRequest = {
      model: effectiveModel,
      messages: input.messages.map((m) =>
        m.role === "tool"
          ? { role: "tool", content: m.content, tool_call_id: m.toolCallId }
          : { role: m.role, content: m.content },
      ),
      max_tokens: input.maxTokens ?? this.defaultMaxTokens,
    };

    if (input.temperature !== undefined) {
      requestBody.temperature = input.temperature;
    }

    if (input.stop && input.stop.length > 0) {
      requestBody.stop = input.stop;
    }

    if (input.tools && input.tools.length > 0) {
      requestBody.tools = input.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      requestBody.tool_choice = input.toolChoice ?? "auto";
    }

    this.logger.debug(
      `OpenRouter request — model: ${effectiveModel}, messages: ${input.messages.length}, max_tokens: ${requestBody.max_tokens}`,
    );

    let rawResponse: OpenRouterResponse;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": this.appName,
      };

      if (this.appUrl) {
        headers["HTTP-Referer"] = this.appUrl;
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      rawResponse = (await response.json()) as OpenRouterResponse;

      if (!response.ok) {
        const errorMessage = rawResponse.error?.message ?? `HTTP ${response.status}`;

        this.logger.error(`OpenRouter API error: ${errorMessage}`, {
          status: response.status,
          model: this.modelId,
        });
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("OpenRouter API error:")) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Network error";

      this.logger.error(`OpenRouter fetch failed: ${message}`);
      throw new Error(`OpenRouter fetch failed: ${message}`, { cause: error });
    }

    const choice = rawResponse.choices?.[0];

    if (!choice) {
      throw new Error("OpenRouter returned no choices in response.");
    }

    const content = choice.message?.content ?? "";
    const rawFinishReason = choice.finish_reason ?? "stop";
    // OpenRouter returns 'tool_calls' for tool invocations; normalize to 'tool_use'
    const finishReason = rawFinishReason === "tool_calls" ? "tool_use" : rawFinishReason;
    const { usage } = rawResponse;

    this.logger.debug(
      `OpenRouter reply — finish_reason: ${finishReason}, tokens: ${usage?.total_tokens ?? "N/A"}`,
    );

    let toolCalls: LLMToolCall[] | undefined;

    if (finishReason === "tool_use" && choice.message?.tool_calls?.length) {
      toolCalls = choice.message.tool_calls.map((tc) => {
        let args: Record<string, unknown> = {};

        try {
          args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          // leave empty on parse error
        }

        return { id: tc.id, name: tc.function.name, arguments: args };
      });
    }

    return {
      content,
      finishReason,
      toolCalls,
      usage: {
        promptTokens: usage?.prompt_tokens ?? null,
        completionTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
      },
      rawResponse,
    };
  }

  /**
   * Estimativa de tokens antes do envio — baseada em heurística de 4 chars/token.
   * Útil para validações de tamanho de contexto antes de chamar a API.
   */
  estimateUsage(input: ChatReplyInput): Promise<UsageEstimate> {
    const totalChars = input.messages.reduce((sum, m) => sum + m.content.length, 0);
    const estimatedPromptTokens = Math.ceil(totalChars / 4);
    const estimatedCompletionTokens = input.maxTokens ?? this.defaultMaxTokens;

    return Promise.resolve({
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedTotalTokens: estimatedPromptTokens + estimatedCompletionTokens,
    });
  }

  listCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: false,
      supportsStructuredOutput: false,
      maxContextTokens: this.maxContextTokens,
      defaultMaxTokens: this.defaultMaxTokens,
    };
  }

  /** Verifica disponibilidade do OpenRouter com uma chamada mínima à API. */
  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          healthy: false,
          latencyMs,
          message: `OpenRouter health check failed: HTTP ${response.status}`,
        };
      }

      return {
        healthy: true,
        latencyMs,
        message: `OpenRouter disponível — modelo: ${this.modelId}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: `OpenRouter health check error: ${message}`,
      };
    }
  }
}
