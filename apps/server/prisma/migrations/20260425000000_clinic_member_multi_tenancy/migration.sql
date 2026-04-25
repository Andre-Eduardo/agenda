-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: clinic_member_multi_tenancy
--
-- Reorganiza o modelo de tenancy: Clinic passa a ser tenant raiz e ClinicMember
-- vira ator central (substituindo Professional como ator). Professional fica como
-- extensão 1:1 de ClinicMember (apenas role=PROFESSIONAL).
--
-- Migration DESTRUTIVA — sistema em desenvolvimento, sem dados de produção.
-- Faz drop completo das tabelas/enums antigos e recria a partir do novo schema.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- 1. DROP do schema antigo
-- ════════════════════════════════════════════════════════════════════════════

-- Drop tabelas antigas (CASCADE remove FKs/índices/sequences automaticamente).
DROP TABLE IF EXISTS "agent_proposal" CASCADE;
DROP TABLE IF EXISTS "clinical_chat_interaction_log" CASCADE;
DROP TABLE IF EXISTS "knowledge_chunk" CASCADE;
DROP TABLE IF EXISTS "patient_context_chunk" CASCADE;
DROP TABLE IF EXISTS "patient_context_snapshot" CASCADE;
DROP TABLE IF EXISTS "patient_chat_message" CASCADE;
DROP TABLE IF EXISTS "patient_chat_session" CASCADE;
DROP TABLE IF EXISTS "ai_agent_profile" CASCADE;
DROP TABLE IF EXISTS "form_field_index" CASCADE;
DROP TABLE IF EXISTS "patient_form" CASCADE;
DROP TABLE IF EXISTS "form_template_version" CASCADE;
DROP TABLE IF EXISTS "form_template" CASCADE;
DROP TABLE IF EXISTS "event" CASCADE;
DROP TABLE IF EXISTS "upload_file" CASCADE;
DROP TABLE IF EXISTS "patient_alert" CASCADE;
DROP TABLE IF EXISTS "clinical_profile" CASCADE;
DROP TABLE IF EXISTS "extracted_field" CASCADE;
DROP TABLE IF EXISTS "imported_document" CASCADE;
DROP TABLE IF EXISTS "file" CASCADE;
DROP TABLE IF EXISTS "record" CASCADE;
DROP TABLE IF EXISTS "professional_block" CASCADE;
DROP TABLE IF EXISTS "working_hours" CASCADE;
DROP TABLE IF EXISTS "appointment" CASCADE;
DROP TABLE IF EXISTS "patient" CASCADE;
DROP TABLE IF EXISTS "professional_config" CASCADE;
DROP TABLE IF EXISTS "professional" CASCADE;
DROP TABLE IF EXISTS "person" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Drop enums antigos.
DROP TYPE IF EXISTS "agent_proposal_status" CASCADE;
DROP TYPE IF EXISTS "agent_proposal_type" CASCADE;
DROP TYPE IF EXISTS "chat_interaction_status" CASCADE;
DROP TYPE IF EXISTS "context_snapshot_status" CASCADE;
DROP TYPE IF EXISTS "context_chunk_source_type" CASCADE;
DROP TYPE IF EXISTS "chat_message_role" CASCADE;
DROP TYPE IF EXISTS "chat_session_status" CASCADE;
DROP TYPE IF EXISTS "file_promotion_status" CASCADE;
DROP TYPE IF EXISTS "appointment_type" CASCADE;
DROP TYPE IF EXISTS "appointment_status" CASCADE;
DROP TYPE IF EXISTS "form_response_status" CASCADE;
DROP TYPE IF EXISTS "form_status" CASCADE;
DROP TYPE IF EXISTS "specialty" CASCADE;
DROP TYPE IF EXISTS "alert_severity" CASCADE;
DROP TYPE IF EXISTS "conduct_tag" CASCADE;
DROP TYPE IF EXISTS "clinical_status_tag" CASCADE;
DROP TYPE IF EXISTS "attendance_type" CASCADE;
DROP TYPE IF EXISTS "import_status" CASCADE;
DROP TYPE IF EXISTS "record_source" CASCADE;
DROP TYPE IF EXISTS "evolution_template_type" CASCADE;
DROP TYPE IF EXISTS "person_type" CASCADE;
DROP TYPE IF EXISTS "person_profile" CASCADE;
DROP TYPE IF EXISTS "gender" CASCADE;
DROP TYPE IF EXISTS "global_role" CASCADE;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. CREATE do novo schema (gerado por `prisma migrate diff --from-empty`)
-- ════════════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "global_role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'NONE');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "person_type" AS ENUM ('NATURAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "clinic_member_role" AS ENUM ('OWNER', 'ADMIN', 'PROFESSIONAL', 'SECRETARY', 'VIEWER');

-- CreateEnum
CREATE TYPE "specialty" AS ENUM ('PSICOLOGIA', 'MEDICINA', 'FISIOTERAPIA', 'FONOAUDIOLOGIA', 'NUTRICAO', 'TERAPIA_OCUPACIONAL', 'ENFERMAGEM', 'OUTROS');

-- CreateEnum
CREATE TYPE "patient_access_level" AS ENUM ('FULL', 'READ_ONLY', 'REGISTER_ONLY', 'NONE');

-- CreateEnum
CREATE TYPE "document_entity_type" AS ENUM ('RECORD', 'FILE', 'IMPORTED_DOCUMENT', 'PATIENT_FORM', 'CLINICAL_PROFILE', 'PATIENT_ALERT');

-- CreateEnum
CREATE TYPE "evolution_template_type" AS ENUM ('SOAP', 'DAP');

-- CreateEnum
CREATE TYPE "record_source" AS ENUM ('MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('UPLOADED', 'QUALITY_CHECKED', 'PREPROCESSED', 'OCR_DONE', 'NORMALIZED', 'CLASSIFIED', 'AI_STRUCTURED', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "attendance_type" AS ENUM ('FIRST_VISIT', 'FOLLOW_UP', 'EVALUATION', 'PROCEDURE', 'TELEMEDICINE', 'INTERCURRENCE');

-- CreateEnum
CREATE TYPE "clinical_status_tag" AS ENUM ('STABLE', 'IMPROVING', 'WORSENING', 'UNCHANGED', 'UNDER_OBSERVATION');

-- CreateEnum
CREATE TYPE "conduct_tag" AS ENUM ('GUIDANCE', 'PRESCRIPTION', 'EXAM_REQUESTED', 'REFERRAL', 'FOLLOW_UP_SCHEDULED', 'THERAPY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "alert_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "form_status" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "form_response_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "appointment_type" AS ENUM ('FIRST_VISIT', 'RETURN', 'WALK_IN', 'TELEMEDICINE', 'PROCEDURE');

-- CreateEnum
CREATE TYPE "file_promotion_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'FAILED', 'READY');

-- CreateEnum
CREATE TYPE "chat_session_status" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "chat_message_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'INTERNAL');

-- CreateEnum
CREATE TYPE "context_chunk_source_type" AS ENUM ('RECORD', 'PATIENT_FORM', 'CLINICAL_PROFILE', 'PATIENT_ALERT', 'IMPORTED_DOCUMENT');

-- CreateEnum
CREATE TYPE "context_snapshot_status" AS ENUM ('PENDING', 'READY', 'STALE', 'FAILED');

-- CreateEnum
CREATE TYPE "chat_interaction_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'FALLBACK');

-- CreateEnum
CREATE TYPE "agent_proposal_type" AS ENUM ('APPOINTMENT', 'APPOINTMENT_CANCEL', 'APPOINTMENT_RESCHEDULE', 'PATIENT_ALERT');

-- CreateEnum
CREATE TYPE "agent_proposal_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "username" CITEXT NOT NULL,
    "email" CITEXT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "global_role" "global_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "phone" TEXT,
    "gender" "gender",
    "person_type" "person_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "person_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document_id" TEXT,
    "phone" TEXT,
    "email" CITEXT,
    "is_personal_clinic" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clinic_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_member" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "clinic_member_role" NOT NULL,
    "display_name" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_by_member_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clinic_member_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional" (
    "id" UUID NOT NULL,
    "clinic_member_id" UUID NOT NULL,
    "registration_number" TEXT,
    "specialty" TEXT,
    "specialty_normalized" "specialty",
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "professional_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_patient_access" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "access_level" "patient_access_level" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clinic_patient_access_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_permission" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "entity_type" "document_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "can_view" BOOLEAN NOT NULL,
    "granted_by_member_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_permission_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "document_id" CITEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "email" CITEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "attended_by_member_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "type" "appointment_type" NOT NULL,
    "status" "appointment_status" NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "canceled_reason" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appointment_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" UUID NOT NULL,
    "clinic_member_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_block" (
    "id" UUID NOT NULL,
    "clinic_member_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_block_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "responsible_professional_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "description" TEXT,
    "template_type" "evolution_template_type",
    "title" TEXT,
    "attendance_type" "attendance_type",
    "clinical_status" "clinical_status_tag",
    "conduct_tags" "conduct_tag"[],
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "free_notes" TEXT,
    "event_date" TIMESTAMP(3),
    "appointment_id" UUID,
    "source" "record_source" NOT NULL DEFAULT 'MANUAL',
    "imported_document_id" UUID,
    "was_human_edited" BOOLEAN NOT NULL DEFAULT false,
    "patient_form_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "record_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "record_id" UUID,
    "patient_id" UUID,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "file_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_document" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "document_type" TEXT,
    "quality_label" TEXT,
    "quality_score" DOUBLE PRECISION,
    "raw_ocr_text" TEXT,
    "normalized_ocr_text" TEXT,
    "ocr_confidence" DOUBLE PRECISION,
    "ai_confidence" DOUBLE PRECISION,
    "status" "import_status" NOT NULL DEFAULT 'UPLOADED',
    "review_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imported_document_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_field" (
    "id" UUID NOT NULL,
    "imported_document_id" UUID NOT NULL,
    "field_key" TEXT NOT NULL,
    "raw_value" TEXT,
    "structured_value" JSONB,
    "confidence" DOUBLE PRECISION,
    "needs_review" BOOLEAN NOT NULL DEFAULT true,
    "corrected_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_field_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_profile" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "responsible_professional_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "allergies" TEXT,
    "chronic_conditions" TEXT,
    "current_medications" TEXT,
    "surgical_history" TEXT,
    "family_history" TEXT,
    "social_history" TEXT,
    "general_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_profile_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_alert" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "alert_severity" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_alert_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_file" (
    "id" UUID NOT NULL,
    "temp_path" TEXT NOT NULL,
    "final_path" TEXT,
    "status" "file_promotion_status" NOT NULL DEFAULT 'PENDING',
    "promotion_attempts" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "clinic_id" UUID,
    "member_id" UUID,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "user_ip" INET NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_template" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialty" "specialty" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "clinic_id" UUID,
    "created_by_member_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "form_template_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_template_version" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "form_status" NOT NULL DEFAULT 'DRAFT',
    "definition_json" JSONB NOT NULL,
    "schema_json" JSONB,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_template_version_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_form" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "responsible_professional_id" UUID,
    "template_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "status" "form_response_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "response_json" JSONB NOT NULL,
    "computed_json" JSONB,
    "applied_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_form_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_index" (
    "id" UUID NOT NULL,
    "patient_form_id" UUID NOT NULL,
    "field_id" TEXT NOT NULL,
    "field_label" TEXT,
    "field_type" TEXT,
    "value_text" TEXT,
    "value_number" DOUBLE PRECISION,
    "value_boolean" BOOLEAN,
    "value_date" TIMESTAMP(3),
    "value_json" JSONB,
    "specialty" "specialty" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_field_index_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_profile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "slug" TEXT NOT NULL,
    "specialty_group" TEXT,
    "specialty" "specialty",
    "description" TEXT,
    "base_instructions" TEXT,
    "allowed_sources" TEXT[],
    "context_priority" JSONB,
    "priority_fields" JSONB,
    "analysis_goals" TEXT[],
    "blacklisted_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guardrails" TEXT,
    "response_style" TEXT,
    "provider_model_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_profile_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chat_session" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "agent_profile_id" UUID,
    "title" TEXT,
    "status" "chat_session_status" NOT NULL DEFAULT 'ACTIVE',
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_chat_session_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chat_message" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "chat_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "chunk_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_chat_message_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_context_snapshot" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "member_id" UUID,
    "patient_facts" JSONB NOT NULL,
    "critical_context" JSONB,
    "timeline_summary" JSONB,
    "content_hash" TEXT NOT NULL,
    "status" "context_snapshot_status" NOT NULL DEFAULT 'PENDING',
    "built_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_context_snapshot_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_context_chunk" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "source_type" "context_chunk_source_type" NOT NULL,
    "source_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "embedding" vector(1536),
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_context_chunk_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_chat_interaction_log" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_message_id" UUID NOT NULL,
    "assistant_message_id" UUID,
    "provider_id" TEXT,
    "model_id" TEXT,
    "agent_profile_id" UUID,
    "agent_slug" TEXT,
    "snapshot_id" UUID,
    "snapshot_version" TEXT,
    "retrieved_chunk_ids" TEXT[],
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "latency_ms" INTEGER,
    "status" "chat_interaction_status" NOT NULL DEFAULT 'PENDING',
    "error_code" TEXT,
    "error_message" TEXT,
    "used_fallback" BOOLEAN NOT NULL DEFAULT false,
    "tool_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proposal_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_iterations" INTEGER,
    "rag_chunks_used" INTEGER,
    "avg_top_k_score" DOUBLE PRECISION,
    "total_duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_chat_interaction_log_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunk" (
    "id" UUID NOT NULL,
    "clinic_id" UUID,
    "specialty" "specialty",
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "source_file" TEXT,
    "source_page" INTEGER,
    "embedding" vector(1536),
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunk_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_proposal" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "session_id" UUID,
    "message_id" UUID,
    "patient_id" UUID,
    "type" "agent_proposal_type" NOT NULL,
    "status" "agent_proposal_status" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "preview" JSONB NOT NULL,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION,
    "result_entity_id" UUID,
    "expires_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "confirmed_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_proposal_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "clinic_member_clinic_idx" ON "clinic_member"("clinic_id");

-- CreateIndex
CREATE INDEX "clinic_member_user_idx" ON "clinic_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_member_clinic_id_user_id_key" ON "clinic_member"("clinic_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_clinic_member_id_key" ON "professional"("clinic_member_id");

-- CreateIndex
CREATE INDEX "clinic_patient_access_clinic_idx" ON "clinic_patient_access"("clinic_id");

-- CreateIndex
CREATE INDEX "clinic_patient_access_patient_idx" ON "clinic_patient_access"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_patient_access_member_id_patient_id_key" ON "clinic_patient_access"("member_id", "patient_id");

-- CreateIndex
CREATE INDEX "document_permission_entity_idx" ON "document_permission"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "document_permission_clinic_idx" ON "document_permission"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_permission_member_id_entity_type_entity_id_key" ON "document_permission"("member_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "patient_clinic_idx" ON "patient"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_document_id_clinic_id_key" ON "patient"("document_id", "clinic_id");

-- CreateIndex
CREATE INDEX "appointment_clinic_idx" ON "appointment"("clinic_id");

-- CreateIndex
CREATE INDEX "appointment_attended_by_idx" ON "appointment"("attended_by_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "record_patient_form_id_key" ON "record"("patient_form_id");

-- CreateIndex
CREATE INDEX "record_clinic_idx" ON "record"("clinic_id");

-- CreateIndex
CREATE INDEX "record_patient_idx" ON "record"("patient_id");

-- CreateIndex
CREATE INDEX "file_clinic_idx" ON "file"("clinic_id");

-- CreateIndex
CREATE INDEX "imported_document_clinic_idx" ON "imported_document"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_profile_patient_id_key" ON "clinical_profile"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_profile_clinic_idx" ON "clinical_profile"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_alert_clinic_idx" ON "patient_alert"("clinic_id");

-- CreateIndex
CREATE INDEX "event_clinic_idx" ON "event"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_template_code_key" ON "form_template"("code");

-- CreateIndex
CREATE INDEX "form_template_clinic_idx" ON "form_template"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_template_version_template_id_version_number_key" ON "form_template_version"("template_id", "version_number");

-- CreateIndex
CREATE INDEX "patient_form_clinic_idx" ON "patient_form"("clinic_id");

-- CreateIndex
CREATE INDEX "form_field_index_specialty_idx" ON "form_field_index"("specialty");

-- CreateIndex
CREATE INDEX "form_field_index_field_id_idx" ON "form_field_index"("field_id");

-- CreateIndex
CREATE INDEX "form_field_index_value_text_idx" ON "form_field_index"("value_text");

-- CreateIndex
CREATE INDEX "form_field_index_value_number_idx" ON "form_field_index"("value_number");

-- CreateIndex
CREATE UNIQUE INDEX "form_field_index_patient_form_id_field_id_key" ON "form_field_index"("patient_form_id", "field_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_profile_code_key" ON "ai_agent_profile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_profile_slug_key" ON "ai_agent_profile"("slug");

-- CreateIndex
CREATE INDEX "patient_chat_session_clinic_idx" ON "patient_chat_session"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_chat_session_patient_idx" ON "patient_chat_session"("patient_id");

-- CreateIndex
CREATE INDEX "patient_chat_session_member_idx" ON "patient_chat_session"("member_id");

-- CreateIndex
CREATE INDEX "patient_chat_message_session_idx" ON "patient_chat_message"("session_id");

-- CreateIndex
CREATE INDEX "patient_context_snapshot_clinic_idx" ON "patient_context_snapshot"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_context_snapshot_patient_idx" ON "patient_context_snapshot"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_context_snapshot_patient_id_member_id_key" ON "patient_context_snapshot"("patient_id", "member_id");

-- CreateIndex
CREATE INDEX "patient_context_chunk_clinic_idx" ON "patient_context_chunk"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_context_chunk_patient_idx" ON "patient_context_chunk"("patient_id");

-- CreateIndex
CREATE INDEX "patient_context_chunk_source_idx" ON "patient_context_chunk"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_context_chunk_patient_id_source_type_source_id_chun_key" ON "patient_context_chunk"("patient_id", "source_type", "source_id", "chunk_index");

-- CreateIndex
CREATE INDEX "clinical_chat_interaction_log_clinic_idx" ON "clinical_chat_interaction_log"("clinic_id");

-- CreateIndex
CREATE INDEX "clinical_chat_interaction_log_session_idx" ON "clinical_chat_interaction_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunk_content_hash_key" ON "knowledge_chunk"("content_hash");

-- CreateIndex
CREATE INDEX "knowledge_chunk_clinic_idx" ON "knowledge_chunk"("clinic_id");

-- CreateIndex
CREATE INDEX "knowledge_chunk_specialty_idx" ON "knowledge_chunk"("specialty");

-- CreateIndex
CREATE INDEX "knowledge_chunk_category_idx" ON "knowledge_chunk"("category");

-- CreateIndex
CREATE INDEX "agent_proposal_clinic_status_idx" ON "agent_proposal"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "agent_proposal_created_by_member_idx" ON "agent_proposal"("created_by_member_id");

-- CreateIndex
CREATE INDEX "agent_proposal_patient_idx" ON "agent_proposal"("patient_id");

-- AddForeignKey
ALTER TABLE "clinic_member" ADD CONSTRAINT "clinic_member_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_member" ADD CONSTRAINT "clinic_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_member" ADD CONSTRAINT "clinic_member_invited_by_member_id_fkey" FOREIGN KEY ("invited_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional" ADD CONSTRAINT "professional_clinic_member_id_fkey" FOREIGN KEY ("clinic_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_patient_access" ADD CONSTRAINT "clinic_patient_access_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_patient_access" ADD CONSTRAINT "clinic_patient_access_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_patient_access" ADD CONSTRAINT "clinic_patient_access_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permission" ADD CONSTRAINT "document_permission_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permission" ADD CONSTRAINT "document_permission_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permission" ADD CONSTRAINT "document_permission_granted_by_member_id_fkey" FOREIGN KEY ("granted_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_id_fkey" FOREIGN KEY ("id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_attended_by_member_id_fkey" FOREIGN KEY ("attended_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_clinic_member_id_fkey" FOREIGN KEY ("clinic_member_id") REFERENCES "clinic_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_block" ADD CONSTRAINT "member_block_clinic_member_id_fkey" FOREIGN KEY ("clinic_member_id") REFERENCES "clinic_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_responsible_professional_id_fkey" FOREIGN KEY ("responsible_professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_imported_document_id_fkey" FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_patient_form_id_fkey" FOREIGN KEY ("patient_form_id") REFERENCES "patient_form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_document" ADD CONSTRAINT "imported_document_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_document" ADD CONSTRAINT "imported_document_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_document" ADD CONSTRAINT "imported_document_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_document" ADD CONSTRAINT "imported_document_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_field" ADD CONSTRAINT "extracted_field_imported_document_id_fkey" FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_responsible_professional_id_fkey" FOREIGN KEY ("responsible_professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_alert" ADD CONSTRAINT "patient_alert_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_alert" ADD CONSTRAINT "patient_alert_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_alert" ADD CONSTRAINT "patient_alert_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_template" ADD CONSTRAINT "form_template_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_template" ADD CONSTRAINT "form_template_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_template_version" ADD CONSTRAINT "form_template_version_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_responsible_professional_id_fkey" FOREIGN KEY ("responsible_professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "form_template_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_index" ADD CONSTRAINT "form_field_index_patient_form_id_fkey" FOREIGN KEY ("patient_form_id") REFERENCES "patient_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_session" ADD CONSTRAINT "patient_chat_session_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_session" ADD CONSTRAINT "patient_chat_session_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_session" ADD CONSTRAINT "patient_chat_session_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_session" ADD CONSTRAINT "patient_chat_session_agent_profile_id_fkey" FOREIGN KEY ("agent_profile_id") REFERENCES "ai_agent_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_message" ADD CONSTRAINT "patient_chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "patient_chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_context_snapshot" ADD CONSTRAINT "patient_context_snapshot_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_context_snapshot" ADD CONSTRAINT "patient_context_snapshot_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_context_snapshot" ADD CONSTRAINT "patient_context_snapshot_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_context_chunk" ADD CONSTRAINT "patient_context_chunk_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_context_chunk" ADD CONSTRAINT "patient_context_chunk_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_chat_interaction_log" ADD CONSTRAINT "clinical_chat_interaction_log_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_chat_interaction_log" ADD CONSTRAINT "clinical_chat_interaction_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "patient_chat_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. Índice HNSW do pgvector para RAG (não suportado nativamente pelo Prisma 6).
-- ════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS "knowledge_chunk_embedding_hnsw_idx"
  ON "knowledge_chunk"
  USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "patient_context_chunk_embedding_hnsw_idx"
  ON "patient_context_chunk"
  USING hnsw ("embedding" vector_cosine_ops);
