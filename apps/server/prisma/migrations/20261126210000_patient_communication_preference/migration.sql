-- L3-04 (LGPD): preferências de comunicação e opt-out do paciente.

-- Lembrete não enviado porque o paciente recusou o canal.
ALTER TYPE "reminder_event_type" ADD VALUE 'OPTED_OUT';

CREATE TYPE "communication_preference_source" AS ENUM ('STAFF', 'WHATSAPP_REPLY', 'EMAIL_COMPLAINT');

-- Histórico append-only: a preferência atual de cada canal é a linha mais recente.
CREATE TABLE "patient_communication_preference_change" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "channel" "reminder_channel" NOT NULL,
    "opted_out" BOOLEAN NOT NULL,
    "source" "communication_preference_source" NOT NULL,
    "changed_by_member_id" UUID,
    "reason" TEXT,
    "external_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_communication_preference_change_pk" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patient_communication_preference_change_external_unique" ON "patient_communication_preference_change"("source", "external_id");

CREATE INDEX "patient_communication_preference_change_patient_idx" ON "patient_communication_preference_change"("clinic_id", "patient_id", "channel", "occurred_at");

ALTER TABLE "patient_communication_preference_change" ADD CONSTRAINT "patient_communication_preference_change_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
