-- L2-04: rastreio de entrega, falha e resposta dos lembretes.

-- Novos estados do lembrete, sempre avançando: SENT -> DELIVERED -> READ -> REPLIED.
ALTER TYPE "reminder_status" ADD VALUE 'DELIVERED' AFTER 'SENT';
ALTER TYPE "reminder_status" ADD VALUE 'READ' AFTER 'DELIVERED';
ALTER TYPE "reminder_status" ADD VALUE 'REPLIED' AFTER 'READ';

CREATE TYPE "reminder_event_type" AS ENUM ('SENT', 'SEND_FAILED', 'RETRY_SCHEDULED', 'DELIVERED', 'READ', 'DELIVERY_FAILED', 'COMPLAINED', 'REPLIED');

CREATE TYPE "reminder_event_source" AS ENUM ('SYSTEM', 'EVOLUTION', 'SES');

ALTER TABLE "appointment_reminder"
    ADD COLUMN "destination" TEXT,
    ADD COLUMN "provider_message_id" TEXT,
    ADD COLUMN "delivered_at" TIMESTAMP(3),
    ADD COLUMN "read_at" TIMESTAMP(3),
    ADD COLUMN "replied_at" TIMESTAMP(3);

CREATE INDEX "appointment_reminder_provider_message_idx" ON "appointment_reminder"("provider_message_id");

CREATE INDEX "appointment_reminder_destination_idx" ON "appointment_reminder"("clinic_id", "channel", "destination");

CREATE TABLE "appointment_reminder_event" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "reminder_id" UUID NOT NULL,
    "type" "reminder_event_type" NOT NULL,
    "source" "reminder_event_source" NOT NULL,
    "external_id" TEXT,
    "attempt" INTEGER,
    "detail" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_reminder_event_pk" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_reminder_event_external_unique" ON "appointment_reminder_event"("source", "external_id");

CREATE INDEX "appointment_reminder_event_reminder_idx" ON "appointment_reminder_event"("reminder_id", "occurred_at");

ALTER TABLE "appointment_reminder_event" ADD CONSTRAINT "appointment_reminder_event_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "appointment_reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
