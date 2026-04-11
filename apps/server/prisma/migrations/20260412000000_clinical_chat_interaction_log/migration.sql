-- ─── Clinical Chat: interaction log audit table ───────────────────────────────
-- Task 6-8 | clinical-chat-rag feature
--
-- Adds:
--   - `chat_interaction_status` enum
--   - `clinical_chat_interaction_log` table (audit log per AI interaction)
--   - Relation column `interactionLogs` on `patient_chat_session`
--
-- Separação intencional:
--   patient_chat_message   → conteúdo da mensagem (o que foi dito)
--   clinical_chat_interaction_log → metadados de execução (provider, tokens, latência, status)
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "chat_interaction_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'FALLBACK');

-- CreateTable
CREATE TABLE "clinical_chat_interaction_log" (
    "id"                   UUID         NOT NULL,
    "session_id"           UUID         NOT NULL,
    "user_message_id"      UUID         NOT NULL,
    "assistant_message_id" UUID,
    "provider_id"          TEXT,
    "model_id"             TEXT,
    "agent_profile_id"     UUID,
    "agent_slug"           TEXT,
    "snapshot_id"          UUID,
    "snapshot_version"     TEXT,
    "retrieved_chunk_ids"  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "prompt_tokens"        INTEGER,
    "completion_tokens"    INTEGER,
    "total_tokens"         INTEGER,
    "latency_ms"           INTEGER,
    "status"               "chat_interaction_status" NOT NULL DEFAULT 'PENDING',
    "error_code"           TEXT,
    "error_message"        TEXT,
    "used_fallback"        BOOLEAN      NOT NULL DEFAULT false,
    "created_at"           TIMESTAMP(3) NOT NULL,
    "updated_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_chat_interaction_log_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_chat_interaction_log_session_idx"
    ON "clinical_chat_interaction_log"("session_id");

-- AddForeignKey
ALTER TABLE "clinical_chat_interaction_log"
    ADD CONSTRAINT "clinical_chat_interaction_log_session_id_fkey"
    FOREIGN KEY ("session_id")
    REFERENCES "patient_chat_session"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
