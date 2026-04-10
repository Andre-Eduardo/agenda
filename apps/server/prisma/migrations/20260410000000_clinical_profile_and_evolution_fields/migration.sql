-- CreateEnum
CREATE TYPE "evolution_template_type" AS ENUM ('SOAP', 'DAP');

-- CreateEnum
CREATE TYPE "attendance_type" AS ENUM ('FIRST_VISIT', 'FOLLOW_UP', 'EVALUATION', 'PROCEDURE', 'TELEMEDICINE', 'INTERCURRENCE');

-- CreateEnum
CREATE TYPE "clinical_status_tag" AS ENUM ('STABLE', 'IMPROVING', 'WORSENING', 'UNCHANGED', 'UNDER_OBSERVATION');

-- CreateEnum
CREATE TYPE "conduct_tag" AS ENUM ('GUIDANCE', 'PRESCRIPTION', 'EXAM_REQUESTED', 'REFERRAL', 'FOLLOW_UP_SCHEDULED', 'THERAPY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "alert_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable patient: add new clinical fields
ALTER TABLE "patient"
    ADD COLUMN "birth_date" TIMESTAMP(3),
    ADD COLUMN "email" CITEXT,
    ADD COLUMN "emergency_contact_name" TEXT,
    ADD COLUMN "emergency_contact_phone" TEXT;

-- AlterTable record: make description nullable, add evolution fields
ALTER TABLE "record"
    ALTER COLUMN "description" DROP NOT NULL,
    ADD COLUMN "template_type" "evolution_template_type",
    ADD COLUMN "title" TEXT,
    ADD COLUMN "attendance_type" "attendance_type",
    ADD COLUMN "clinical_status" "clinical_status_tag",
    ADD COLUMN "conduct_tags" "conduct_tag"[] DEFAULT ARRAY[]::"conduct_tag"[],
    ADD COLUMN "subjective" TEXT,
    ADD COLUMN "objective" TEXT,
    ADD COLUMN "assessment" TEXT,
    ADD COLUMN "plan" TEXT,
    ADD COLUMN "free_notes" TEXT,
    ADD COLUMN "event_date" TIMESTAMP(3),
    ADD COLUMN "appointment_id" UUID;

-- AlterTable file: make record_id nullable, add patient_id
ALTER TABLE "file"
    ALTER COLUMN "record_id" DROP NOT NULL,
    ADD COLUMN "patient_id" UUID;

-- AddForeignKey for record.appointment_id
ALTER TABLE "record" ADD CONSTRAINT "record_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for file.patient_id
ALTER TABLE "file" ADD CONSTRAINT "file_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable clinical_profile
CREATE TABLE "clinical_profile" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
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

-- CreateIndex for clinical_profile.patient_id (unique 1:1)
CREATE UNIQUE INDEX "clinical_profile_patient_id_key" ON "clinical_profile"("patient_id");

-- AddForeignKey for clinical_profile.patient_id
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for clinical_profile.professional_id
ALTER TABLE "clinical_profile" ADD CONSTRAINT "clinical_profile_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable patient_alert
CREATE TABLE "patient_alert" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "alert_severity" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_alert_pk" PRIMARY KEY ("id")
);

-- AddForeignKey for patient_alert.patient_id
ALTER TABLE "patient_alert" ADD CONSTRAINT "patient_alert_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for patient_alert.professional_id
ALTER TABLE "patient_alert" ADD CONSTRAINT "patient_alert_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
