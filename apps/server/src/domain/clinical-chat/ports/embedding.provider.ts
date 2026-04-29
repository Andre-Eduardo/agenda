/**
 * Contrato abstrato para provedores de embeddings vetoriais.
 *
 * ─── COMO PLUGAR UM PROVIDER REAL ───────────────────────────────────────────
 * 1. Implemente esta interface em `infrastructure/ai-provider/`
 * 2. Registre no `AiProviderModule` com o token `EMBEDDING_PROVIDER_TOKEN`
 * 3. Ative o pgvector no schema Prisma:
 *    - datasource: adicione `extensions = [pgvector(map: "vector")]`
 *    - PatientContextChunk.embedding: troque `Json?` por `Unsupported("vector(1536)")`
 *    - Adicione índice: `@@index([embedding], type: Hnsw, ops: VectorCosineOps)`
 * 4. Atualize `IndexPatientChunksService` para chamar `embeddingProvider.generateEmbedding()`
 *    e armazenar o resultado em `PatientContextChunk.embedding`
 * 5. Atualize `PatientContextChunkRepository.searchSimilar()` para usar cosine similarity
 *
 * Providers sugeridos:
 * - OpenAI text-embedding-3-small (1536 dims) — boa relação custo/qualidade
 * - OpenAI text-embedding-3-large (3072 dims) — melhor qualidade
 * - Anthropic voyage-3 (1024 dims) — otimizado para recuperação
 * - Local/self-hosted: Ollama com nomic-embed-text (768 dims)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface EmbeddingProvider {
  /** Identificador único do provider (ex: "openai-embedding", "mock-embedding") */
  readonly providerId: string;
  /** Dimensão dos vetores gerados (deve corresponder ao schema pgvector configurado) */
  readonly dimensions: number;

  /** Gera embedding para um único texto. */
  generateEmbedding(text: string): Promise<number[]>;

  /** Gera embeddings em batch — mais eficiente que chamadas individuais. */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /** Retorna a dimensão dos vetores gerados. */
  vectorDimensions(): number;

  /** Verifica se o provider de embeddings está disponível. */
  healthCheck(): Promise<{ healthy: boolean; latencyMs?: number; message?: string }>;
}

/** Token abstrato para injeção de dependência no NestJS */
export abstract class EmbeddingProvider {}
