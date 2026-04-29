import { Injectable, Logger } from "@nestjs/common";
import type { EmbeddingProvider } from "@domain/clinical-chat/ports/embedding.provider";

/** Configuração injetada no provider via factory no AiProviderModule */
export type OpenAiEmbeddingConfig = {
  apiKey: string;
  /**
   * Modelo de embeddings da OpenAI.
   * Padrão: "text-embedding-3-small" (1536 dims, melhor custo-benefício).
   * Alternativa: "text-embedding-3-large" (3072 dims) ou "text-embedding-ada-002" (1536 dims).
   */
  model?: string;
};

type OpenAiEmbeddingRequest = {
  model: string;
  input: string | string[];
  encoding_format: "float";
};

type OpenAiEmbeddingResponse = {
  object: "list";
  data: Array<{
    object: "embedding";
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type?: string;
    code?: string | number;
  };
};

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

/** Número de dimensões por modelo de embeddings da OpenAI. */
const MODEL_DIMENSIONS: Record<string, number> = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "text-embedding-ada-002": 1536,
};

/**
 * Provider de embeddings vetoriais utilizando a API da OpenAI.
 *
 * Implementa a interface `EmbeddingProvider` para que o RAG possa
 * funcionar independentemente do provider de chat configurado.
 *
 * ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────
 * Variáveis de ambiente necessárias:
 * - OPENAI_API_KEY           — chave de API obtida em https://platform.openai.com/api-keys
 * - OPENAI_EMBEDDING_MODEL   — modelo (padrão: text-embedding-3-small)
 *
 * Ativação em AiProviderModule:
 * AI_EMBEDDING_PROVIDER=openai
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(OpenAiEmbeddingProvider.name);

  readonly providerId = "openai-embedding";
  readonly dimensions: number;

  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: OpenAiEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "text-embedding-3-small";
    this.dimensions = MODEL_DIMENSIONS[this.model] ?? 1536;
  }

  /** Gera embedding para um único texto. */
  async generateEmbedding(text: string): Promise<number[]> {
    const results = await this.callApi([text]);

    return results[0];
  }

  /**
   * Gera embeddings em batch — envia todos os textos em uma única requisição.
   * Significativamente mais eficiente que chamadas individuais para indexação em massa.
   */
  generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return Promise.resolve([]);

    return this.callApi(texts);
  }

  vectorDimensions(): number {
    return this.dimensions;
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs?: number; message?: string }> {
    const start = Date.now();

    try {
      await this.generateEmbedding("health-check");

      return {
        healthy: true,
        latencyMs: Date.now() - start,
        message: `OpenAI embeddings disponível — modelo: ${this.model} (${this.dimensions} dims)`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: `OpenAI embeddings error: ${message}`,
      };
    }
  }

  /**
   * Chama a API de embeddings da OpenAI.
   * Aceita um ou múltiplos textos e retorna vetores na mesma ordem.
   */
  private async callApi(inputs: string[]): Promise<number[][]> {
    const requestBody: OpenAiEmbeddingRequest = {
      model: this.model,
      // A API aceita string única ou array — enviamos array para uniformidade
      input: inputs.length === 1 ? inputs[0] : inputs,
      encoding_format: "float",
    };

    this.logger.debug(`OpenAI embeddings request — model: ${this.model}, inputs: ${inputs.length}`);

    let response: Response;
    let raw: OpenAiEmbeddingResponse;

    try {
      response = await fetch(OPENAI_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      raw = (await response.json()) as OpenAiEmbeddingResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";

      this.logger.error(`OpenAI embeddings fetch failed: ${message}`);
      throw new Error(`OpenAI embeddings fetch failed: ${message}`, { cause: error });
    }

    if (!response.ok) {
      const errorMessage = raw.error?.message ?? `HTTP ${response.status}`;

      this.logger.error(`OpenAI embeddings API error: ${errorMessage}`, {
        status: response.status,
        model: this.model,
      });
      throw new Error(`OpenAI embeddings API error: ${errorMessage}`);
    }

    this.logger.debug(
      `OpenAI embeddings reply — total_tokens: ${raw.usage?.total_tokens ?? "N/A"}`,
    );

    // Ordenar por index para garantir que a ordem corresponde ao input
    return raw.data.toSorted((a, b) => a.index - b.index).map((item) => item.embedding);
  }
}
