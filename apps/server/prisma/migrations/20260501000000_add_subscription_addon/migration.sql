-- Migration: Add SubscriptionAddon table for extra quota packages.

CREATE TABLE "subscription_addon" (
  "id"                    UUID             NOT NULL,
  "clinic_id"             UUID             NOT NULL,
  "member_id"             UUID             NOT NULL,
  "subscription_id"       UUID             NOT NULL,
  "addon_code"            TEXT             NOT NULL,
  "quantity"              INTEGER          NOT NULL DEFAULT 1,
  "period_year"           INTEGER          NOT NULL,
  "period_month"          INTEGER          NOT NULL,
  "price_paid_brl"        DOUBLE PRECISION NOT NULL,
  "granted_by_member_id"  UUID,
  "created_at"            TIMESTAMP(3)     NOT NULL,
  "updated_at"            TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "subscription_addon_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "subscription_addon"
  ADD CONSTRAINT "subscription_addon_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_addon"
  ADD CONSTRAINT "subscription_addon_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_addon"
  ADD CONSTRAINT "subscription_addon_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "professional_subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_addon"
  ADD CONSTRAINT "subscription_addon_granted_by_member_id_fkey"
    FOREIGN KEY ("granted_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "subscription_addon_member_code_period_unique"
  ON "subscription_addon"("member_id", "addon_code", "period_year", "period_month");

CREATE INDEX "subscription_addon_clinic_idx"
  ON "subscription_addon"("clinic_id");

CREATE INDEX "subscription_addon_member_period_idx"
  ON "subscription_addon"("member_id", "period_year", "period_month");
