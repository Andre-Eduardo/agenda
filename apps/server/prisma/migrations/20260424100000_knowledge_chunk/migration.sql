-- CreateTable: knowledge_chunk
-- Stores global/company-scoped knowledge chunks (protocols, CIDs, manuals, guidelines)
-- for Knowledge-RAG retrieval. Separate from patient_context_chunk (no patient_id).

CREATE TABLE "knowledge_chunk" (
    "id"           UUID         NOT NULL,
    "company_id"   UUID,
    "specialty"    "specialty",
    "category"     TEXT         NOT NULL,
    "content"      TEXT         NOT NULL,
    "metadata"     JSONB,
    "source_file"  TEXT,
    "source_page"  INTEGER,
    "embedding"    vector(1536),
    "content_hash" TEXT         NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunk_pk" PRIMARY KEY ("id")
);

-- Unique constraint on content_hash for deduplication
CREATE UNIQUE INDEX "knowledge_chunk_content_hash_key" ON "knowledge_chunk"("content_hash");

-- Standard B-tree indexes for filtering
CREATE INDEX "knowledge_chunk_company_idx"   ON "knowledge_chunk"("company_id");
CREATE INDEX "knowledge_chunk_specialty_idx" ON "knowledge_chunk"("specialty");
CREATE INDEX "knowledge_chunk_category_idx"  ON "knowledge_chunk"("category");

-- HNSW index for cosine similarity search via pgvector
-- Created separately because Prisma v6 does not support pgvector index syntax.
CREATE INDEX "knowledge_chunk_embedding_hnsw_idx"
    ON "knowledge_chunk" USING hnsw (embedding vector_cosine_ops);
