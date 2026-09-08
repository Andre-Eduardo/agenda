-- CreateEnum
CREATE TYPE "patient_package_status" AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "patient_package_credit_event_type" AS ENUM ('CONSUMPTION', 'REFUND', 'MANUAL_ADJUSTMENT', 'EXPIRATION');

-- CreateEnum
CREATE TYPE "patient_insurance_enrollment_status" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "insurance_authorization_status" AS ENUM ('NOT_REQUIRED', 'PENDING', 'AUTHORIZED', 'DENIED');

-- CreateEnum
CREATE TYPE "insurance_claim_status" AS ENUM ('DRAFT', 'SUBMITTED', 'PAID', 'PARTIALLY_PAID', 'DENIED', 'APPEALED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "patient_subscription_status" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "payment_method" ADD VALUE 'PACKAGE';
ALTER TYPE "payment_method" ADD VALUE 'SUBSCRIPTION';

-- AlterTable
ALTER TABLE "appointment_payment" ADD COLUMN     "patient_package_id" UUID,
ADD COLUMN     "patient_subscription_id" UUID;

-- CreateTable
CREATE TABLE "package_plan" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_credits" INTEGER NOT NULL,
    "price_brl" DOUBLE PRECISION NOT NULL,
    "validity_days" INTEGER,
    "appointment_type" "appointment_type",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "package_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_package" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "package_plan_id" UUID NOT NULL,
    "plan_name_snapshot" TEXT NOT NULL,
    "total_credits" INTEGER NOT NULL,
    "price_brl" DOUBLE PRECISION NOT NULL,
    "remaining_credits" INTEGER NOT NULL,
    "status" "patient_package_status" NOT NULL DEFAULT 'ACTIVE',
    "purchased_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "payment_method" "payment_method" NOT NULL,
    "paid_at" TIMESTAMP(3),
    "sold_by_member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_package_credit" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_package_id" UUID NOT NULL,
    "appointment_payment_id" UUID,
    "type" "patient_package_credit_event_type" NOT NULL,
    "delta" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "registered_by_member_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_package_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_insurance_enrollment" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "insurance_plan_id" UUID NOT NULL,
    "card_number" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "patient_insurance_enrollment_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_insurance_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claim" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "appointment_payment_id" UUID NOT NULL,
    "patient_insurance_enrollment_id" UUID NOT NULL,
    "insurance_plan_id" UUID NOT NULL,
    "authorization_code" TEXT,
    "authorization_status" "insurance_authorization_status" NOT NULL DEFAULT 'NOT_REQUIRED',
    "claim_status" "insurance_claim_status" NOT NULL DEFAULT 'DRAFT',
    "submitted_amount_brl" DOUBLE PRECISION NOT NULL,
    "approved_amount_brl" DOUBLE PRECISION,
    "glosa_reason" TEXT,
    "glosa_amount_brl" DOUBLE PRECISION,
    "submitted_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_subscription_plan" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_appointment_quota" INTEGER NOT NULL,
    "price_brl" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_subscription" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "subscription_plan_id" UUID NOT NULL,
    "plan_name_snapshot" TEXT NOT NULL,
    "monthly_quota_snapshot" INTEGER NOT NULL,
    "price_brl_snapshot" DOUBLE PRECISION NOT NULL,
    "status" "patient_subscription_status" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_subscription_usage" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_subscription_id" UUID NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "appointments_used" INTEGER NOT NULL DEFAULT 0,
    "quota_snapshot" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_plan_clinic_idx" ON "package_plan"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_package_clinic_idx" ON "patient_package"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_package_patient_idx" ON "patient_package"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_package_credit_appointment_payment_id_key" ON "patient_package_credit"("appointment_payment_id");

-- CreateIndex
CREATE INDEX "patient_package_credit_package_idx" ON "patient_package_credit"("patient_package_id");

-- CreateIndex
CREATE INDEX "patient_package_credit_clinic_idx" ON "patient_package_credit"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_insurance_enrollment_clinic_idx" ON "patient_insurance_enrollment"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_insurance_enrollment_patient_idx" ON "patient_insurance_enrollment"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_insurance_enrollment_patient_id_insurance_plan_id_key" ON "patient_insurance_enrollment"("patient_id", "insurance_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_claim_appointment_payment_id_key" ON "insurance_claim"("appointment_payment_id");

-- CreateIndex
CREATE INDEX "insurance_claim_clinic_idx" ON "insurance_claim"("clinic_id");

-- CreateIndex
CREATE INDEX "insurance_claim_status_idx" ON "insurance_claim"("claim_status");

-- CreateIndex
CREATE INDEX "insurance_claim_enrollment_idx" ON "insurance_claim"("patient_insurance_enrollment_id");

-- CreateIndex
CREATE INDEX "patient_subscription_plan_clinic_idx" ON "patient_subscription_plan"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_subscription_clinic_idx" ON "patient_subscription"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_subscription_patient_idx" ON "patient_subscription"("patient_id");

-- CreateIndex
CREATE INDEX "patient_subscription_usage_clinic_idx" ON "patient_subscription_usage"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_subscription_usage_patient_subscription_id_period_y_key" ON "patient_subscription_usage"("patient_subscription_id", "period_year", "period_month");

-- CreateIndex
CREATE INDEX "appointment_payment_package_idx" ON "appointment_payment"("patient_package_id");

-- CreateIndex
CREATE INDEX "appointment_payment_subscription_idx" ON "appointment_payment"("patient_subscription_id");

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_patient_package_id_fkey" FOREIGN KEY ("patient_package_id") REFERENCES "patient_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_patient_subscription_id_fkey" FOREIGN KEY ("patient_subscription_id") REFERENCES "patient_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_plan" ADD CONSTRAINT "package_plan_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package" ADD CONSTRAINT "patient_package_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package" ADD CONSTRAINT "patient_package_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package" ADD CONSTRAINT "patient_package_package_plan_id_fkey" FOREIGN KEY ("package_plan_id") REFERENCES "package_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package" ADD CONSTRAINT "patient_package_sold_by_member_id_fkey" FOREIGN KEY ("sold_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package_credit" ADD CONSTRAINT "patient_package_credit_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package_credit" ADD CONSTRAINT "patient_package_credit_patient_package_id_fkey" FOREIGN KEY ("patient_package_id") REFERENCES "patient_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package_credit" ADD CONSTRAINT "patient_package_credit_appointment_payment_id_fkey" FOREIGN KEY ("appointment_payment_id") REFERENCES "appointment_payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_package_credit" ADD CONSTRAINT "patient_package_credit_registered_by_member_id_fkey" FOREIGN KEY ("registered_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_insurance_enrollment" ADD CONSTRAINT "patient_insurance_enrollment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_insurance_enrollment" ADD CONSTRAINT "patient_insurance_enrollment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_insurance_enrollment" ADD CONSTRAINT "patient_insurance_enrollment_insurance_plan_id_fkey" FOREIGN KEY ("insurance_plan_id") REFERENCES "insurance_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claim" ADD CONSTRAINT "insurance_claim_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claim" ADD CONSTRAINT "insurance_claim_appointment_payment_id_fkey" FOREIGN KEY ("appointment_payment_id") REFERENCES "appointment_payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claim" ADD CONSTRAINT "insurance_claim_patient_insurance_enrollment_id_fkey" FOREIGN KEY ("patient_insurance_enrollment_id") REFERENCES "patient_insurance_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claim" ADD CONSTRAINT "insurance_claim_insurance_plan_id_fkey" FOREIGN KEY ("insurance_plan_id") REFERENCES "insurance_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription_plan" ADD CONSTRAINT "patient_subscription_plan_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription" ADD CONSTRAINT "patient_subscription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription" ADD CONSTRAINT "patient_subscription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription" ADD CONSTRAINT "patient_subscription_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "patient_subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription_usage" ADD CONSTRAINT "patient_subscription_usage_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_subscription_usage" ADD CONSTRAINT "patient_subscription_usage_patient_subscription_id_fkey" FOREIGN KEY ("patient_subscription_id") REFERENCES "patient_subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: backfill the primary insurance enrollment from the legacy Patient.insurance_plan_id
-- columns. Those columns are kept as a read-only cache of the primary enrollment going forward —
-- see PatientInsuranceEnrollment in schema.prisma.
INSERT INTO "patient_insurance_enrollment" (
    "id", "clinic_id", "patient_id", "insurance_plan_id", "card_number", "valid_until",
    "is_primary", "status", "created_at", "updated_at"
)
SELECT
    gen_random_uuid(),
    p."clinic_id",
    p."id",
    p."insurance_plan_id",
    p."insurance_card_number",
    p."insurance_valid_until",
    true,
    'ACTIVE',
    now(),
    now()
FROM "patient" p
WHERE p."insurance_plan_id" IS NOT NULL
  AND p."deleted_at" IS NULL;
