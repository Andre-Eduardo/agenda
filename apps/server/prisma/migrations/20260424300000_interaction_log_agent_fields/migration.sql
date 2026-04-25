-- AlterTable: clinical_chat_interaction_log
-- Add agent observability fields for tool call tracing and RAG metrics.

ALTER TABLE "clinical_chat_interaction_log"
    ADD COLUMN "tool_names"       TEXT[]           NOT NULL DEFAULT '{}',
    ADD COLUMN "proposal_ids"     TEXT[]           NOT NULL DEFAULT '{}',
    ADD COLUMN "total_iterations" INTEGER,
    ADD COLUMN "rag_chunks_used"  INTEGER,
    ADD COLUMN "avg_top_k_score"  DOUBLE PRECISION,
    ADD COLUMN "total_duration_ms" INTEGER;
