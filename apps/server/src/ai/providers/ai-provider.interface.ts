export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiChatParams = {
  /** Modelo no formato OpenRouter: 'anthropic/claude-sonnet-4', 'openai/gpt-4o' */
  modelId: string;
  messages: AiMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  /** Opções extras específicas do provider */
  providerOptions?: Record<string, unknown>;
};

export type AiChatResponse = {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Modelo efetivamente usado (OpenRouter pode rotear para outro) */
  modelId: string;
  /** Sempre 'openrouter' neste adapter */
  providerId: string;
  rawResponse?: unknown;
};

export type AiStreamChunk = {
  delta: string;
  done: boolean;
};

export interface IAiProvider {
  chat(params: AiChatParams): Promise<AiChatResponse>;
  stream(params: AiChatParams): AsyncIterable<AiStreamChunk>;
}

/** Token abstrato para injeção de dependência no NestJS */
export abstract class IAiProvider {}
