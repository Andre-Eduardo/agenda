-- Migration: Add ClinicalDocumentType, ClinicalDocumentStatus enums,
-- ClinicalDocumentTemplate and ClinicalDocument tables.

CREATE TYPE "clinical_document_type" AS ENUM (
  'PRESCRIPTION',
  'PRESCRIPTION_SPECIAL',
  'MEDICAL_CERTIFICATE',
  'REFERRAL',
  'EXAM_REQUEST'
);

CREATE TYPE "clinical_document_status" AS ENUM (
  'DRAFT',
  'GENERATED',
  'CANCELLED'
);

CREATE TABLE "clinical_document_template" (
  "id"          UUID        NOT NULL,
  "clinic_id"   UUID,
  "type"        "clinical_document_type" NOT NULL,
  "is_default"  BOOLEAN     NOT NULL DEFAULT false,
  "name"        TEXT        NOT NULL,
  "layout_json" JSONB       NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "clinical_document_template_pk" PRIMARY KEY ("id"),
  CONSTRAINT "clinical_document_template_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "clinical_document_template_clinic_type_unique"
    UNIQUE ("clinic_id", "type")
);

CREATE INDEX "clinical_document_template_clinic_idx"
  ON "clinical_document_template"("clinic_id");

CREATE TABLE "clinical_document" (
  "id"                          UUID        NOT NULL,
  "clinic_id"                   UUID        NOT NULL,
  "patient_id"                  UUID        NOT NULL,
  "created_by_member_id"        UUID        NOT NULL,
  "responsible_professional_id" UUID        NOT NULL,
  "type"                        "clinical_document_type" NOT NULL,
  "template_id"                 UUID,
  "content_json"                JSONB       NOT NULL,
  "file_id"                     UUID        UNIQUE,
  "generated_at"                TIMESTAMP(3),
  "status"                      "clinical_document_status" NOT NULL DEFAULT 'DRAFT',
  "appointment_id"              UUID,
  "record_id"                   UUID,
  "created_at"                  TIMESTAMP(3) NOT NULL,
  "updated_at"                  TIMESTAMP(3) NOT NULL,
  "deleted_at"                  TIMESTAMP(3),

  CONSTRAINT "clinical_document_pk" PRIMARY KEY ("id"),
  CONSTRAINT "clinical_document_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "clinical_document_patient_fk"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id"),
  CONSTRAINT "clinical_document_created_by_fk"
    FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id"),
  CONSTRAINT "clinical_document_professional_fk"
    FOREIGN KEY ("responsible_professional_id") REFERENCES "professional"("id"),
  CONSTRAINT "clinical_document_template_fk"
    FOREIGN KEY ("template_id") REFERENCES "clinical_document_template"("id"),
  CONSTRAINT "clinical_document_file_fk"
    FOREIGN KEY ("file_id") REFERENCES "file"("id"),
  CONSTRAINT "clinical_document_appointment_fk"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id"),
  CONSTRAINT "clinical_document_record_fk"
    FOREIGN KEY ("record_id") REFERENCES "record"("id")
);

CREATE INDEX "clinical_document_clinic_idx"
  ON "clinical_document"("clinic_id");

CREATE INDEX "clinical_document_patient_idx"
  ON "clinical_document"("patient_id");

CREATE INDEX "clinical_document_created_by_idx"
  ON "clinical_document"("created_by_member_id");
