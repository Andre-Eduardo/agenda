-- Initial migration: base schema (state before 20260410000000_clinical_profile_and_evolution_fields)

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "citext";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "global_role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'NONE');
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "person_profile" AS ENUM ('PROFESSIONAL', 'PATIENT');
CREATE TYPE "person_type" AS ENUM ('NATURAL', 'LEGAL');
CREATE TYPE "appointment_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE "appointment_type" AS ENUM ('FIRST_VISIT', 'RETURN', 'WALK_IN', 'TELEMEDICINE', 'PROCEDURE');
CREATE TYPE "file_promotion_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'FAILED', 'READY');
CREATE TYPE "import_status" AS ENUM (
    'UPLOADED', 'QUALITY_CHECKED', 'PREPROCESSED', 'OCR_DONE', 'NORMALIZED',
    'CLASSIFIED', 'AI_STRUCTURED', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'FAILED'
);
CREATE TYPE "record_source" AS ENUM ('MANUAL', 'IMPORT');

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE "user" (
    "id"          UUID      NOT NULL,
    "username"    CITEXT    NOT NULL,
    "email"       CITEXT,
    "name"        TEXT      NOT NULL,
    "password"    TEXT      NOT NULL,
    "phone"       TEXT,
    "global_role" "global_role" NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    "deleted_at"  TIMESTAMP(3),
    CONSTRAINT "user_pk" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "person" (
    "id"          UUID        NOT NULL,
    "name"        TEXT        NOT NULL,
    "document_id" TEXT        NOT NULL,
    "phone"       TEXT,
    "gender"      "gender",
    "person_type" "person_type" NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    "deleted_at"  TIMESTAMP(3),
    CONSTRAINT "person_pk" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "person_document_id_key" ON "person"("document_id");

CREATE TABLE "professional_config" (
    "id"         UUID      NOT NULL,
    "color"      TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "professional_config_pk" PRIMARY KEY ("id")
);

CREATE TABLE "professional" (
    "id"         UUID NOT NULL,
    "person_id"  UUID NOT NULL,
    "config_id"  UUID NOT NULL,
    "user_id"    UUID NOT NULL,
    "specialty"  TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "professional_pk" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "professional_person_id_key" ON "professional"("person_id");
CREATE UNIQUE INDEX "professional_config_id_key" ON "professional"("config_id");

-- patient: note document_id had a global unique index (dropped by 20260415)
CREATE TABLE "patient" (
    "id"              UUID   NOT NULL,
    "document_id"     CITEXT NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    "deleted_at"      TIMESTAMP(3),
    "professional_id" UUID,
    CONSTRAINT "patient_pk" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patient_document_id_key" ON "patient"("document_id");

CREATE TABLE "appointment" (
    "id"               UUID NOT NULL,
    "professional_id"  UUID NOT NULL,
    "patient_id"       UUID NOT NULL,
    "start_at"         TIMESTAMP(3) NOT NULL,
    "end_at"           TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "type"             "appointment_type"   NOT NULL,
    "status"           "appointment_status" NOT NULL,
    "canceled_at"      TIMESTAMP(3),
    "canceled_reason"  TEXT,
    "note"             TEXT,
    "created_at"       TIMESTAMP(3) NOT NULL,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    "deleted_at"       TIMESTAMP(3),
    CONSTRAINT "appointment_pk" PRIMARY KEY ("id")
);

CREATE TABLE "working_hours" (
    "id"             UUID    NOT NULL,
    "professional_id" UUID   NOT NULL,
    "day_of_week"    INTEGER NOT NULL,
    "start_time"     TEXT    NOT NULL,
    "end_time"       TEXT    NOT NULL,
    "slot_duration"  INTEGER NOT NULL,
    "active"         BOOLEAN NOT NULL DEFAULT true,
    "created_at"     TIMESTAMP(3) NOT NULL,
    "updated_at"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "working_hours_pk" PRIMARY KEY ("id")
);

CREATE TABLE "professional_block" (
    "id"             UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "start_at"       TIMESTAMP(3) NOT NULL,
    "end_at"         TIMESTAMP(3) NOT NULL,
    "reason"         TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL,
    "updated_at"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "professional_block_pk" PRIMARY KEY ("id")
);

CREATE TABLE "upload_file" (
    "id"                 UUID NOT NULL,
    "temp_path"          TEXT NOT NULL,
    "final_path"         TEXT,
    "status"             "file_promotion_status" NOT NULL DEFAULT 'PENDING',
    "promotion_attempts" INTEGER NOT NULL DEFAULT 0,
    "mime_type"          TEXT NOT NULL,
    "size"               INTEGER NOT NULL,
    "checksum"           TEXT,
    "created_at"         TIMESTAMP(3) NOT NULL,
    "updated_at"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "upload_file_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event" (
    "id"              SERIAL NOT NULL,
    "type"            TEXT   NOT NULL,
    "payload"         JSONB  NOT NULL,
    "user_ip"         INET   NOT NULL,
    "user_id"         UUID,
    "professional_id" UUID,
    "timestamp"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- file: record_id is NOT NULL in the initial schema (made nullable by 20260410)
CREATE TABLE "file" (
    "id"          UUID NOT NULL,
    "record_id"   UUID NOT NULL,
    "file_name"   TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    "deleted_at"  TIMESTAMP(3),
    CONSTRAINT "file_pk" PRIMARY KEY ("id")
);

-- imported_document depends on patient, professional, file
CREATE TABLE "imported_document" (
    "id"                   UUID         NOT NULL,
    "patient_id"           UUID         NOT NULL,
    "professional_id"      UUID         NOT NULL,
    "file_id"              UUID         NOT NULL,
    "document_type"        TEXT,
    "quality_label"        TEXT,
    "quality_score"        DOUBLE PRECISION,
    "raw_ocr_text"         TEXT,
    "normalized_ocr_text"  TEXT,
    "ocr_confidence"       DOUBLE PRECISION,
    "ai_confidence"        DOUBLE PRECISION,
    "status"               "import_status" NOT NULL DEFAULT 'UPLOADED',
    "review_required"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"           TIMESTAMP(3) NOT NULL,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "imported_document_pk" PRIMARY KEY ("id")
);

-- record: description is NOT NULL, no evolution fields, no appointment_id, no patient_form_id
CREATE TABLE "record" (
    "id"                   UUID NOT NULL,
    "professional_id"      UUID NOT NULL,
    "patient_id"           UUID NOT NULL,
    "description"          TEXT NOT NULL,
    "source"               "record_source" NOT NULL DEFAULT 'MANUAL',
    "imported_document_id" UUID,
    "was_human_edited"     BOOLEAN NOT NULL DEFAULT false,
    "created_at"           TIMESTAMP(3) NOT NULL,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    "deleted_at"           TIMESTAMP(3),
    CONSTRAINT "record_pk" PRIMARY KEY ("id")
);

CREATE TABLE "extracted_field" (
    "id"                   UUID NOT NULL,
    "imported_document_id" UUID NOT NULL,
    "field_key"            TEXT NOT NULL,
    "raw_value"            TEXT,
    "structured_value"     JSONB,
    "confidence"           DOUBLE PRECISION,
    "needs_review"         BOOLEAN NOT NULL DEFAULT true,
    "corrected_value"      JSONB,
    "created_at"           TIMESTAMP(3) NOT NULL,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "extracted_field_pk" PRIMARY KEY ("id")
);

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "professional"
    ADD CONSTRAINT "professional_person_id_fkey"
        FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "professional_config_id_fkey"
        FOREIGN KEY ("config_id") REFERENCES "professional_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "professional_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient"
    ADD CONSTRAINT "patient_id_fkey"
        FOREIGN KEY ("id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "patient_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment"
    ADD CONSTRAINT "appointment_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "appointment_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "working_hours"
    ADD CONSTRAINT "working_hours_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_block"
    ADD CONSTRAINT "professional_block_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "file"
    ADD CONSTRAINT "file_record_id_fkey"
        FOREIGN KEY ("record_id") REFERENCES "record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "imported_document"
    ADD CONSTRAINT "imported_document_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "imported_document_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "imported_document_file_id_fkey"
        FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "record"
    ADD CONSTRAINT "record_professional_id_fkey"
        FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "record_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "record_imported_document_id_fkey"
        FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "extracted_field"
    ADD CONSTRAINT "extracted_field_imported_document_id_fkey"
        FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
