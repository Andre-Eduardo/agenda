-- =============================================================================
-- Migration: refactor_schema_security
-- Blocos 1-9 do prompt de refatoração
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Bloco 1: AiSpecialtyGroup enum (substitui Specialty)
-- ---------------------------------------------------------------------------

CREATE TYPE "ai_specialty_group" AS ENUM (
    'SAUDE_MENTAL',
    'REABILITACAO',
    'MEDICINA_GERAL',
    'MEDICINA_ESPECIALIZADA',
    'NUTRICAO_DIETETICA',
    'ENFERMAGEM',
    'OUTROS'
);

-- FormTemplate: specialty (required) → specialtyGroup (nullable) + specialtyLabel
ALTER TABLE "form_template"
    ADD COLUMN "specialty_group" "ai_specialty_group",
    ADD COLUMN "specialty_label" TEXT;

-- Migrar dados existentes: converter specialty → specialty_group via mapeamento
UPDATE "form_template" SET "specialty_group" = CASE "specialty"::text
    WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
    WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
    WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
    WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
    WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
    WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
    WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
    WHEN 'OUTROS'             THEN 'OUTROS'
    ELSE 'OUTROS'
END::"ai_specialty_group";

ALTER TABLE "form_template" DROP COLUMN IF EXISTS "specialty";

-- FormFieldIndex: specialty (required) → specialtyGroup (nullable)
ALTER TABLE "form_field_index"
    ADD COLUMN "specialty_group" "ai_specialty_group";

UPDATE "form_field_index" SET "specialty_group" = CASE "specialty"::text
    WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
    WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
    WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
    WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
    WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
    WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
    WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
    WHEN 'OUTROS'             THEN 'OUTROS'
    ELSE NULL
END::"ai_specialty_group";

DROP INDEX IF EXISTS "form_field_index_specialty_idx";
ALTER TABLE "form_field_index" DROP COLUMN IF EXISTS "specialty";
CREATE INDEX "form_field_index_specialty_group_idx" ON "form_field_index"("specialty_group");

-- Professional: specialtyNormalized Specialty? → AiSpecialtyGroup?
ALTER TABLE "professional"
    ADD COLUMN "specialty_normalized_new" "ai_specialty_group";

UPDATE "professional" SET "specialty_normalized_new" = CASE "specialty_normalized"::text
    WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
    WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
    WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
    WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
    WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
    WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
    WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
    WHEN 'OUTROS'             THEN 'OUTROS'
    ELSE NULL
END::"ai_specialty_group"
WHERE "specialty_normalized" IS NOT NULL;

ALTER TABLE "professional" DROP COLUMN IF EXISTS "specialty_normalized";
ALTER TABLE "professional" RENAME COLUMN "specialty_normalized_new" TO "specialty_normalized";

-- AiAgentProfile: remove specialty column, change specialtyGroup to AiSpecialtyGroup
ALTER TABLE "ai_agent_profile"
    ADD COLUMN "specialty_group_new" "ai_specialty_group";

UPDATE "ai_agent_profile" SET "specialty_group_new" = CASE "specialty"::text
    WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
    WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
    WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
    WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
    WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
    WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
    WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
    WHEN 'OUTROS'             THEN 'OUTROS'
    ELSE NULL
END::"ai_specialty_group"
WHERE "specialty" IS NOT NULL;

ALTER TABLE "ai_agent_profile" DROP COLUMN IF EXISTS "specialty";
ALTER TABLE "ai_agent_profile" DROP COLUMN IF EXISTS "specialty_group";
ALTER TABLE "ai_agent_profile" RENAME COLUMN "specialty_group_new" TO "specialty_group";

-- KnowledgeChunk: specialty Specialty? → AiSpecialtyGroup?
ALTER TABLE "knowledge_chunk"
    ADD COLUMN "specialty_new" "ai_specialty_group";

UPDATE "knowledge_chunk" SET "specialty_new" = CASE "specialty"::text
    WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
    WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
    WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
    WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
    WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
    WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
    WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
    WHEN 'OUTROS'             THEN 'OUTROS'
    ELSE NULL
END::"ai_specialty_group"
WHERE "specialty" IS NOT NULL;

DROP INDEX IF EXISTS "knowledge_chunk_specialty_idx";
ALTER TABLE "knowledge_chunk" DROP COLUMN IF EXISTS "specialty";
ALTER TABLE "knowledge_chunk" RENAME COLUMN "specialty_new" TO "specialty";
CREATE INDEX "knowledge_chunk_specialty_group_idx" ON "knowledge_chunk"("specialty");

-- Clinic: clinicSpecialties Specialty[] → AiSpecialtyGroup[]
-- Note: converting array type requires explicit cast logic
ALTER TABLE "clinic"
    ADD COLUMN "clinic_specialties_new" "ai_specialty_group"[];

UPDATE "clinic" SET "clinic_specialties_new" = ARRAY(
    SELECT CASE s::text
        WHEN 'PSICOLOGIA'         THEN 'SAUDE_MENTAL'
        WHEN 'MEDICINA'           THEN 'MEDICINA_GERAL'
        WHEN 'FISIOTERAPIA'       THEN 'REABILITACAO'
        WHEN 'FONOAUDIOLOGIA'     THEN 'REABILITACAO'
        WHEN 'NUTRICAO'           THEN 'NUTRICAO_DIETETICA'
        WHEN 'TERAPIA_OCUPACIONAL'THEN 'REABILITACAO'
        WHEN 'ENFERMAGEM'         THEN 'ENFERMAGEM'
        WHEN 'OUTROS'             THEN 'OUTROS'
        ELSE 'OUTROS'
    END::"ai_specialty_group"
    FROM unnest("clinic_specialties") AS s
)
WHERE array_length("clinic_specialties", 1) > 0;

ALTER TABLE "clinic" DROP COLUMN IF EXISTS "clinic_specialties";
ALTER TABLE "clinic" RENAME COLUMN "clinic_specialties_new" TO "clinic_specialties";

-- Drop old specialty enum
DROP TYPE IF EXISTS "specialty";

-- ---------------------------------------------------------------------------
-- Bloco 2: @relation declarations — AgentProposal confirmedBy rename
-- ---------------------------------------------------------------------------

ALTER TABLE "agent_proposal"
    RENAME COLUMN "confirmed_by" TO "confirmed_by_member_id";

-- ---------------------------------------------------------------------------
-- Bloco 3: ClinicalDocumentTemplate — partial unique indexes for NULL safety
-- ---------------------------------------------------------------------------

-- Remove the broken unique constraint (doesn't handle NULL correctly for multi-row defaults)
ALTER TABLE "clinical_document_template"
    DROP CONSTRAINT IF EXISTS "clinical_document_template_clinic_type_unique";

-- One default template per type globally (clinic_id IS NULL)
CREATE UNIQUE INDEX "clinical_document_template_global_type_unique"
    ON "clinical_document_template"("type")
    WHERE "clinic_id" IS NULL;

-- One template per (clinic, type) for clinic-scoped templates
CREATE UNIQUE INDEX "clinical_document_template_clinic_type_unique"
    ON "clinical_document_template"("clinic_id", "type")
    WHERE "clinic_id" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Bloco 6: Add clinicId to PatientChatMessage, WorkingHours, MemberBlock
-- ---------------------------------------------------------------------------

-- PatientChatMessage: backfill from session
ALTER TABLE "patient_chat_message"
    ADD COLUMN "clinic_id" UUID;

UPDATE "patient_chat_message" m
    SET "clinic_id" = s."clinic_id"
    FROM "patient_chat_session" s
    WHERE m."session_id" = s."id";

ALTER TABLE "patient_chat_message"
    ALTER COLUMN "clinic_id" SET NOT NULL;

ALTER TABLE "patient_chat_message"
    ADD CONSTRAINT "patient_chat_message_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id");

CREATE INDEX "patient_chat_message_clinic_idx" ON "patient_chat_message"("clinic_id");

-- WorkingHours: backfill from clinic_member → clinic
ALTER TABLE "working_hours"
    ADD COLUMN "clinic_id" UUID;

UPDATE "working_hours" wh
    SET "clinic_id" = cm."clinic_id"
    FROM "clinic_member" cm
    WHERE wh."clinic_member_id" = cm."id";

ALTER TABLE "working_hours"
    ALTER COLUMN "clinic_id" SET NOT NULL;

ALTER TABLE "working_hours"
    ADD CONSTRAINT "working_hours_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id");

CREATE INDEX "working_hours_clinic_idx" ON "working_hours"("clinic_id");

-- MemberBlock: backfill from clinic_member → clinic
ALTER TABLE "member_block"
    ADD COLUMN "clinic_id" UUID;

UPDATE "member_block" mb
    SET "clinic_id" = cm."clinic_id"
    FROM "clinic_member" cm
    WHERE mb."clinic_member_id" = cm."id";

ALTER TABLE "member_block"
    ALTER COLUMN "clinic_id" SET NOT NULL;

ALTER TABLE "member_block"
    ADD CONSTRAINT "member_block_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id");

CREATE INDEX "member_block_clinic_idx" ON "member_block"("clinic_id");

-- ---------------------------------------------------------------------------
-- Bloco 7: Add deletedAt to AppointmentPayment, WorkingHours, MemberBlock
-- ---------------------------------------------------------------------------

ALTER TABLE "appointment_payment"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

ALTER TABLE "working_hours"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

ALTER TABLE "member_block"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Bloco 8: Remove documentId from Person (lives in Patient)
-- ---------------------------------------------------------------------------

ALTER TABLE "person"
    DROP COLUMN IF EXISTS "document_id";
