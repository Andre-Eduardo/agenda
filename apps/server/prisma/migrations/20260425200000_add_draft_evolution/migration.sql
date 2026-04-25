-- Migration: Add DraftEvolution model for AI-assisted pre-evolution drafts.

CREATE TYPE "draft_evolution_status" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "draft_evolution" (
  "id"                    UUID                     NOT NULL,
  "clinic_id"             UUID                     NOT NULL,
  "patient_id"            UUID                     NOT NULL,
  "created_by_member_id"  UUID                     NOT NULL,
  "imported_document_id"  UUID,
  "template_type"         "evolution_template_type",
  "title"                 TEXT,
  "attendance_type"       "attendance_type",
  "clinical_status"       "clinical_status_tag",
  "conduct_tags"          "conduct_tag"[]          NOT NULL DEFAULT '{}',
  "subjective"            TEXT,
  "objective"             TEXT,
  "assessment"            TEXT,
  "plan"                  TEXT,
  "free_notes"            TEXT,
  "event_date"            TIMESTAMP(3),
  "overall_confidence"    DOUBLE PRECISION,
  "status"                "draft_evolution_status" NOT NULL DEFAULT 'DRAFT',
  "was_human_edited"      BOOLEAN                  NOT NULL DEFAULT FALSE,
  "review_required"       BOOLEAN                  NOT NULL DEFAULT TRUE,
  "approved_by_member_id" UUID,
  "approved_at"           TIMESTAMP(3),
  "record_id"             UUID,
  "created_at"            TIMESTAMP(3)             NOT NULL,
  "updated_at"            TIMESTAMP(3)             NOT NULL,

  CONSTRAINT "draft_evolution_pk"                 PRIMARY KEY ("id"),
  CONSTRAINT "draft_evolution_imported_doc_uniq"  UNIQUE ("imported_document_id"),
  CONSTRAINT "draft_evolution_record_uniq"        UNIQUE ("record_id"),
  CONSTRAINT "draft_evolution_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "draft_evolution_patient_fk"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id"),
  CONSTRAINT "draft_evolution_created_by_fk"
    FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id"),
  CONSTRAINT "draft_evolution_imported_doc_fk"
    FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id"),
  CONSTRAINT "draft_evolution_approved_by_fk"
    FOREIGN KEY ("approved_by_member_id") REFERENCES "clinic_member"("id"),
  CONSTRAINT "draft_evolution_record_fk"
    FOREIGN KEY ("record_id") REFERENCES "record"("id")
);

CREATE INDEX "draft_evolution_clinic_id_idx"   ON "draft_evolution"("clinic_id");
CREATE INDEX "draft_evolution_patient_id_idx"  ON "draft_evolution"("patient_id");
