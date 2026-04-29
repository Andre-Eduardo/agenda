import { Injectable } from "@nestjs/common";
import type { EmbeddingProvider } from "@domain/clinical-chat/ports/embedding.provider";

/**
 * Provider mock de embeddings para desenvolvimento.
 *
 * Gera vetores aleatórios de dimensão fixa — NÃO útil para busca semântica real.
 * Mantém a arquitetura funcionando sem depender de APIs externas.
 *
 * ─── QUANDO ATIVAR EMBEDDINGS REAIS ─────────────────────────────────────────
 * 1. Crie ex: `infrastructure/ai-provider/openai-embedding.provider.ts`
 *    implementando `EmbeddingProvider`
 * 2. Em `AiProviderModule`, troque:
 *    `{ provide: EMBEDDING_PROVIDER_TOKEN, useClass: MockEmbeddingProvider }`
 *    por:
 *    `{ provide: EMBEDDING_PROVIDER_TOKEN, useClass: OpenAiEmbeddingProvider }`
 * 3. Ative o pgvector no Prisma schema (ver comentário em PatientContextChunk)
 * 4. Atualize `IndexPatientChunksService` para chamar este provider ao indexar
 * 5. Atualize `PatientContextChunkRepository.searchSimilar()` para usar cosine similarity
 *
 * Providers sugeridos:
 * - `text-embedding-3-small` (OpenAI, 1536 dims) — bom custo-benefício
 * - `text-embedding-3-large` (OpenAI, 3072 dims) — maior qualidade
 * - `voyage-3` (Anthropic, 1024 dims) — otimizado para retrieval
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = "mock-embedding";
  readonly dimensions = 1536;

  generateEmbedding(_text: string): Promise<number[]> {
    // Vetor aleatório — não útil para similaridade semântica real
    return Promise.resolve(Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1));
  }

  generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generateEmbedding(t)));
  }

  vectorDimensions(): number {
    return this.dimensions;
  }

  healthCheck(): Promise<{ healthy: boolean; latencyMs?: number; message?: string }> {
    return Promise.resolve({
      healthy: true,
      latencyMs: 0,
      message: "Mock embedding provider sempre disponível — nenhuma API externa necessária.",
    });
  }
}
