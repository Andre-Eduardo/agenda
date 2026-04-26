-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED', 'FAILED');

-- AlterTable: add Asaas external IDs and payment tracking fields to professional_subscription
ALTER TABLE "professional_subscription"
    ADD COLUMN "asaas_customer_id"     TEXT,
    ADD COLUMN "asaas_subscription_id" TEXT,
    ADD COLUMN "last_payment_status"   "payment_status",
    ADD COLUMN "last_payment_at"       TIMESTAMP(3),
    ADD COLUMN "next_due_date"         TIMESTAMP(3);

-- CreateTable: payment_event (append-only webhook log)
CREATE TABLE "payment_event" (
    "id"                   UUID         NOT NULL,
    "clinic_id"            UUID         NOT NULL,
    "member_id"            UUID         NOT NULL,
    "subscription_id"      UUID         NOT NULL,
    "asaas_payment_id"     TEXT,
    "asaas_subscription_id" TEXT,
    "event_type"           TEXT         NOT NULL,
    "amount"               DOUBLE PRECISION,
    "payment_method"       TEXT,
    "status"               "payment_status" NOT NULL,
    "raw_payload"          JSONB        NOT NULL,
    "processed_at"         TIMESTAMP(3),
    "created_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_event_member_idx" ON "payment_event"("member_id");
CREATE INDEX "payment_event_subscription_idx" ON "payment_event"("subscription_id");
CREATE INDEX "payment_event_asaas_payment_idx" ON "payment_event"("asaas_payment_id");

-- AddForeignKey
ALTER TABLE "payment_event"
    ADD CONSTRAINT "payment_event_subscription_id_fkey"
    FOREIGN KEY ("subscription_id")
    REFERENCES "professional_subscription"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
