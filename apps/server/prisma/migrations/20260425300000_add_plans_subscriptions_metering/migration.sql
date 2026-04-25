-- Migration: Add PlanCode, SubscriptionStatus enums and
-- ProfessionalSubscription, UsageRecord tables.

CREATE TYPE "plan_code" AS ENUM (
  'STARTER',
  'CONSULTORIO',
  'CLINICA',
  'ESPECIALISTA'
);

CREATE TYPE "subscription_status" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'TRIAL'
);

CREATE TABLE "professional_subscription" (
  "id"                    UUID                  NOT NULL,
  "clinic_id"             UUID                  NOT NULL,
  "member_id"             UUID                  NOT NULL,
  "plan_code"             "plan_code"           NOT NULL,
  "status"                "subscription_status" NOT NULL DEFAULT 'ACTIVE',
  "current_period_start"  TIMESTAMP(3)          NOT NULL,
  "current_period_end"    TIMESTAMP(3)          NOT NULL,
  "previous_plan_code"    "plan_code",
  "plan_changed_at"       TIMESTAMP(3),
  "created_at"            TIMESTAMP(3)          NOT NULL,
  "updated_at"            TIMESTAMP(3)          NOT NULL,
  "deleted_at"            TIMESTAMP(3),

  CONSTRAINT "professional_subscription_pk"
    PRIMARY KEY ("id"),
  CONSTRAINT "professional_subscription_member_unique"
    UNIQUE ("member_id"),
  CONSTRAINT "professional_subscription_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "professional_subscription_member_fk"
    FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id")
);

CREATE INDEX "professional_subscription_clinic_idx"
  ON "professional_subscription"("clinic_id");

CREATE INDEX "professional_subscription_plan_code_idx"
  ON "professional_subscription"("plan_code");

CREATE TABLE "usage_record" (
  "id"                  UUID         NOT NULL,
  "clinic_id"           UUID         NOT NULL,
  "member_id"           UUID         NOT NULL,
  "subscription_id"     UUID         NOT NULL,
  "period_year"         INTEGER      NOT NULL,
  "period_month"        INTEGER      NOT NULL,
  "docs_uploaded"       INTEGER      NOT NULL DEFAULT 0,
  "chat_messages"       INTEGER      NOT NULL DEFAULT 0,
  "clinical_images"     INTEGER      NOT NULL DEFAULT 0,
  "storage_hot_gb_used" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "plan_code_snapshot"  "plan_code"  NOT NULL,
  "created_at"          TIMESTAMP(3) NOT NULL,
  "updated_at"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "usage_record_pk"
    PRIMARY KEY ("id"),
  CONSTRAINT "usage_record_member_period_unique"
    UNIQUE ("member_id", "period_year", "period_month"),
  CONSTRAINT "usage_record_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "usage_record_member_fk"
    FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id"),
  CONSTRAINT "usage_record_subscription_fk"
    FOREIGN KEY ("subscription_id") REFERENCES "professional_subscription"("id")
);

CREATE INDEX "usage_record_clinic_idx"
  ON "usage_record"("clinic_id");

CREATE INDEX "usage_record_member_idx"
  ON "usage_record"("member_id");
