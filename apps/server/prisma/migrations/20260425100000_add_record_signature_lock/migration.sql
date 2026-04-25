-- Migration: Add signature/lock fields to record table and create record_amendment table.

-- Add signature and lock fields to record table
ALTER TABLE "record"
  ADD COLUMN "is_locked"          BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN "signed_at"          TIMESTAMP(3),
  ADD COLUMN "signed_by_member_id" UUID;

ALTER TABLE "record"
  ADD CONSTRAINT "record_signed_by_member_fk"
    FOREIGN KEY ("signed_by_member_id") REFERENCES "clinic_member"("id");

-- Create record_amendment table
CREATE TABLE "record_amendment" (
  "id"                    UUID         NOT NULL,
  "clinic_id"             UUID         NOT NULL,
  "record_id"             UUID         NOT NULL,
  "requested_by_member_id" UUID        NOT NULL,
  "justification"         TEXT         NOT NULL,
  "reopened_at"           TIMESTAMP(3) NOT NULL,
  "relocked_at"           TIMESTAMP(3),
  "created_at"            TIMESTAMP(3) NOT NULL,
  "updated_at"            TIMESTAMP(3) NOT NULL,

  CONSTRAINT "record_amendment_pk" PRIMARY KEY ("id"),
  CONSTRAINT "record_amendment_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "record_amendment_record_fk"
    FOREIGN KEY ("record_id") REFERENCES "record"("id"),
  CONSTRAINT "record_amendment_requested_by_fk"
    FOREIGN KEY ("requested_by_member_id") REFERENCES "clinic_member"("id")
);

CREATE INDEX "record_amendment_clinic_id_idx" ON "record_amendment"("clinic_id");
CREATE INDEX "record_amendment_record_id_idx" ON "record_amendment"("record_id");
