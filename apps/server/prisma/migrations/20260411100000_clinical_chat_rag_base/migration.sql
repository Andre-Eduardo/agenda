-- ─── Clinical Chat & RAG: base migration ─────────────────────────────────────
-- Adds: AiAgentProfile, PatientChatSession, PatientChatMessage,
--       PatientContextSnapshot, PatientContextChunk
--
-- EMBEDDING NOTE: The `embedding` column in `patient_context_chunk` is stored
-- as JSONB in this migration. When pgvector is activated:
--   1. Install: CREATE EXTENSION IF NOT EXISTS vector;
--   2. Alter column: ALTER TABLE patient_context_chunk ALTER COLUMN embedding TYPE vector(1536) USING embedding::text::vector;
--   3. Add HNSW index: CREATE INDEX ON patient_context_chunk USING hnsw (embedding vector_cosine_ops);
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "chat_session_status" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "chat_message_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'INTERNAL');

-- CreateEnum
CREATE TYPE "context_chunk_source_type" AS ENUM ('RECORD', 'PATIENT_FORM', 'CLINICAL_PROFILE', 'PATIENT_ALERT', 'IMPORTED_DOCUMENT');

-- CreateEnum
CREATE TYPE "context_snapshot_status" AS ENUM ('PENDING', 'READY', 'STALE', 'FAILED');

-- CreateTable ai_agent_profile
-- Stores configurable AI agent profiles per clinical specialty.
-- These are the "personas" that will be used to configure LLM prompts (next phase).
CREATE TABLE "ai_agent_profile" (
    "id"               UUID    NOT NULL,
    "name"             TEXT    NOT NULL,
    "slug"             TEXT    NOT NULL,
    "specialty"        "specialty",
    "description"      TEXT,
    "base_instructions" TEXT,
    "allowed_sources"  TEXT[]  NOT NULL DEFAULT '{}',
    "context_priority" JSONB,
    "is_active"        BOOLEAN NOT NULL DEFAULT true,
    "created_at"       TIMESTAMP(3) NOT NULL,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_profile_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_profile_slug_key" ON "ai_agent_profile"("slug");

-- CreateTable patient_chat_session
CREATE TABLE "patient_chat_session" (
    "id"               UUID                  NOT NULL,
    "patient_id"       UUID                  NOT NULL,
    "professional_id"  UUID                  NOT NULL,
    "agent_profile_id" UUID,
    "title"            TEXT,
    "status"           "chat_session_status" NOT NULL DEFAULT 'ACTIVE',
    "last_activity_at" TIMESTAMP(3)          NOT NULL,
    "created_at"       TIMESTAMP(3)          NOT NULL,
    "updated_at"       TIMESTAMP(3)          NOT NULL,
    "deleted_at"       TIMESTAMP(3),

    CONSTRAINT "patient_chat_session_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_chat_session_patient_idx" ON "patient_chat_session"("patient_id");

-- CreateIndex
CREATE INDEX "patient_chat_session_professional_idx" ON "patient_chat_session"("professional_id");

-- CreateTable patient_chat_message
CREATE TABLE "patient_chat_message" (
    "id"         UUID                 NOT NULL,
    "session_id" UUID                 NOT NULL,
    "role"       "chat_message_role"  NOT NULL,
    "content"    TEXT                 NOT NULL,
    "metadata"   JSONB,
    "chunk_ids"  TEXT[]               NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3)         NOT NULL,
    "updated_at" TIMESTAMP(3)         NOT NULL,

    CONSTRAINT "patient_chat_message_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_chat_message_session_idx" ON "patient_chat_message"("session_id");

-- CreateTable patient_context_snapshot
CREATE TABLE "patient_context_snapshot" (
    "id"               UUID                      NOT NULL,
    "patient_id"       UUID                      NOT NULL,
    "professional_id"  UUID,
    "patient_facts"    JSONB                     NOT NULL,
    "critical_context" JSONB,
    "timeline_summary" JSONB,
    "content_hash"     TEXT                      NOT NULL,
    "status"           "context_snapshot_status" NOT NULL DEFAULT 'PENDING',
    "built_at"         TIMESTAMP(3),
    "created_at"       TIMESTAMP(3)              NOT NULL,
    "updated_at"       TIMESTAMP(3)              NOT NULL,

    CONSTRAINT "patient_context_snapshot_pk" PRIMARY KEY ("id")
);

-- CreateIndex (unique per patient+professional pair)
CREATE UNIQUE INDEX "patient_context_snapshot_unique"
    ON "patient_context_snapshot"("patient_id", "professional_id");

-- CreateIndex
CREATE INDEX "patient_context_snapshot_patient_idx" ON "patient_context_snapshot"("patient_id");

-- CreateTable patient_context_chunk
-- `embedding` stored as JSONB placeholder — upgrade to vector(1536) when pgvector is enabled.
CREATE TABLE "patient_context_chunk" (
    "id"           UUID                        NOT NULL,
    "patient_id"   UUID                        NOT NULL,
    "source_type"  "context_chunk_source_type" NOT NULL,
    "source_id"    UUID                        NOT NULL,
    "content"      TEXT                        NOT NULL,
    "metadata"     JSONB,
    "chunk_index"  INTEGER                     NOT NULL DEFAULT 0,
    "embedding"    JSONB,
    "content_hash" TEXT                        NOT NULL,
    "created_at"   TIMESTAMP(3)                NOT NULL,
    "updated_at"   TIMESTAMP(3)                NOT NULL,

    CONSTRAINT "patient_context_chunk_pk" PRIMARY KEY ("id")
);

-- CreateIndex (unique per patient+source+chunk-index for safe upsert)
CREATE UNIQUE INDEX "patient_context_chunk_unique"
    ON "patient_context_chunk"("patient_id", "source_type", "source_id", "chunk_index");

-- CreateIndex
CREATE INDEX "patient_context_chunk_patient_idx" ON "patient_context_chunk"("patient_id");

-- CreateIndex
CREATE INDEX "patient_context_chunk_source_idx" ON "patient_context_chunk"("source_type", "source_id");

-- AddForeignKey: patient_chat_session → patient
ALTER TABLE "patient_chat_session"
    ADD CONSTRAINT "patient_chat_session_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: patient_chat_session → professional
ALTER TABLE "patient_chat_session"
    ADD CONSTRAINT "patient_chat_session_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: patient_chat_session → ai_agent_profile
ALTER TABLE "patient_chat_session"
    ADD CONSTRAINT "patient_chat_session_agent_profile_id_fkey"
    FOREIGN KEY ("agent_profile_id") REFERENCES "ai_agent_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: patient_chat_message → patient_chat_session (cascade delete)
ALTER TABLE "patient_chat_message"
    ADD CONSTRAINT "patient_chat_message_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "patient_chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: patient_context_snapshot → patient
ALTER TABLE "patient_context_snapshot"
    ADD CONSTRAINT "patient_context_snapshot_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: patient_context_snapshot → professional
ALTER TABLE "patient_context_snapshot"
    ADD CONSTRAINT "patient_context_snapshot_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: patient_context_chunk → patient
ALTER TABLE "patient_context_chunk"
    ADD CONSTRAINT "patient_context_chunk_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
