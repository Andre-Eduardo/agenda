-- ─── pgvector: ativar extensão e migrar coluna embedding ─────────────────────
-- Ativa a extensão pgvector e converte a coluna `embedding` de JSONB placeholder
-- para o tipo nativo vector(1536), habilitando busca semântica por cosine similarity.
--
-- IMPACTO: linhas existentes com embedding = NULL são mantidas sem alteração.
-- Linhas com embedding preenchido (vetores mock em JSON) são convertidas para vector.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Habilitar a extensão pgvector (idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Converter coluna de JSONB para vector(1536)
--    USING: converte array JSON '[1.0,2.0,...]' para vector via cast de texto.
--    NULL é preservado (rows sem embedding permanecem sem vetor).
ALTER TABLE patient_context_chunk
    ALTER COLUMN embedding TYPE vector(1536)
    USING CASE
        WHEN embedding IS NULL THEN NULL
        ELSE (embedding::text)::vector(1536)
    END;

-- 3. Índice HNSW para busca aproximada por cosine similarity (alta performance)
--    m=16 e ef_construction=64 são os defaults do pgvector — adequados para produção.
CREATE INDEX patient_context_chunk_embedding_hnsw_idx
    ON patient_context_chunk
    USING hnsw (embedding vector_cosine_ops);
