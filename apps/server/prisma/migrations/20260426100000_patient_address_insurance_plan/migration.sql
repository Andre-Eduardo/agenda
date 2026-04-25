-- Migration: patient_address_insurance_plan
--
-- Cria os modelos PatientAddress e InsurancePlan.
-- Adiciona ao modelo Patient campos de convênio:
--   insurance_plan_id, insurance_card_number, insurance_valid_until

-- CreateTable: insurance_plan
CREATE TABLE "insurance_plan" (
    "id"         UUID        NOT NULL,
    "clinic_id"  UUID        NOT NULL,
    "name"       TEXT        NOT NULL,
    "code"       TEXT,
    "is_active"  BOOLEAN     NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "insurance_plan_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insurance_plan_clinic_idx" ON "insurance_plan"("clinic_id");

-- AddForeignKey
ALTER TABLE "insurance_plan"
  ADD CONSTRAINT "insurance_plan_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: patient_address
CREATE TABLE "patient_address" (
    "id"           UUID        NOT NULL,
    "patient_id"   UUID        NOT NULL,
    "clinic_id"    UUID        NOT NULL,
    "street"       TEXT,
    "number"       TEXT,
    "complement"   TEXT,
    "neighborhood" TEXT,
    "city"         TEXT,
    "state"        TEXT,
    "zip_code"     TEXT,
    "country"      TEXT DEFAULT 'BR',
    "created_at"   TIMESTAMP(3) NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_address_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_address_patient_id_key" ON "patient_address"("patient_id");

-- CreateIndex
CREATE INDEX "patient_address_clinic_idx" ON "patient_address"("clinic_id");

-- AddForeignKey
ALTER TABLE "patient_address"
  ADD CONSTRAINT "patient_address_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_address"
  ADD CONSTRAINT "patient_address_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: patient — add insurance fields
ALTER TABLE "patient"
  ADD COLUMN "insurance_plan_id"      UUID,
  ADD COLUMN "insurance_card_number"  TEXT,
  ADD COLUMN "insurance_valid_until"  TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "patient"
  ADD CONSTRAINT "patient_insurance_plan_id_fkey"
  FOREIGN KEY ("insurance_plan_id") REFERENCES "insurance_plan"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
