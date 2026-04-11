-- CreateEnum
CREATE TYPE "specialty" AS ENUM ('PSICOLOGIA', 'MEDICINA', 'FISIOTERAPIA', 'FONOAUDIOLOGIA', 'NUTRICAO', 'TERAPIA_OCUPACIONAL', 'ENFERMAGEM', 'OUTROS');

-- CreateEnum
CREATE TYPE "form_status" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "form_response_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable professional: add specialtyNormalized column
ALTER TABLE "professional"
    ADD COLUMN "specialty_normalized" "specialty";

-- AlterTable record: add optional link to patient_form
ALTER TABLE "record"
    ADD COLUMN "patient_form_id" UUID;

-- CreateTable form_template
CREATE TABLE "form_template" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialty" "specialty" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "professional_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "form_template_pk" PRIMARY KEY ("id")
);

-- CreateTable form_template_version
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

-- CreateTable patient_form
CREATE TABLE "patient_form" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
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

-- CreateTable form_field_index
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

-- CreateIndex for form_template.code (unique)
CREATE UNIQUE INDEX "form_template_code_key" ON "form_template"("code");

-- CreateIndex for form_template_version (templateId, versionNumber) unique
CREATE UNIQUE INDEX "form_template_version_unique" ON "form_template_version"("template_id", "version_number");

-- CreateIndex for record.patient_form_id (unique optional link)
CREATE UNIQUE INDEX "record_patient_form_id_key" ON "record"("patient_form_id");

-- CreateIndex for form_field_index (patientFormId, fieldId) unique
CREATE UNIQUE INDEX "form_field_index_unique" ON "form_field_index"("patient_form_id", "field_id");

-- CreateIndex for form_field_index.specialty
CREATE INDEX "form_field_index_specialty_idx" ON "form_field_index"("specialty");

-- CreateIndex for form_field_index.field_id
CREATE INDEX "form_field_index_field_id_idx" ON "form_field_index"("field_id");

-- CreateIndex for form_field_index.value_text
CREATE INDEX "form_field_index_value_text_idx" ON "form_field_index"("value_text");

-- CreateIndex for form_field_index.value_number
CREATE INDEX "form_field_index_value_number_idx" ON "form_field_index"("value_number");

-- GIN index for JSONB search on response_json (performance for future AI/analytics queries)
CREATE INDEX "patient_form_response_json_gin_idx" ON "patient_form" USING GIN ("response_json");

-- AddForeignKey form_template.professional_id -> professional.id
ALTER TABLE "form_template" ADD CONSTRAINT "form_template_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey form_template_version.template_id -> form_template.id
ALTER TABLE "form_template_version" ADD CONSTRAINT "form_template_version_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "form_template"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey patient_form.patient_id -> patient.id
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey patient_form.professional_id -> professional.id
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey patient_form.template_id -> form_template.id
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "form_template"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey patient_form.version_id -> form_template_version.id
ALTER TABLE "patient_form" ADD CONSTRAINT "patient_form_version_id_fkey"
    FOREIGN KEY ("version_id") REFERENCES "form_template_version"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey record.patient_form_id -> patient_form.id
ALTER TABLE "record" ADD CONSTRAINT "record_patient_form_id_fkey"
    FOREIGN KEY ("patient_form_id") REFERENCES "patient_form"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey form_field_index.patient_form_id -> patient_form.id
ALTER TABLE "form_field_index" ADD CONSTRAINT "form_field_index_patient_form_id_fkey"
    FOREIGN KEY ("patient_form_id") REFERENCES "patient_form"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
