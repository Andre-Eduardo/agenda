-- Migration: Add ReminderChannel and ReminderStatus enums,
-- AppointmentReminder and ClinicReminderConfig tables.

CREATE TYPE "reminder_channel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');
CREATE TYPE "reminder_status"  AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "appointment_reminder" (
  "id"             UUID        NOT NULL,
  "clinic_id"      UUID        NOT NULL,
  "appointment_id" UUID        NOT NULL,
  "patient_id"     UUID        NOT NULL,
  "channel"        "reminder_channel" NOT NULL,
  "status"         "reminder_status"  NOT NULL DEFAULT 'PENDING',
  "scheduled_at"   TIMESTAMP(3) NOT NULL,
  "sent_at"        TIMESTAMP(3),
  "failed_at"      TIMESTAMP(3),
  "attempts"       INTEGER     NOT NULL DEFAULT 0,
  "error_message"  TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL,
  "updated_at"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "appointment_reminder_pk" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_reminder_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "appointment_reminder_appointment_fk"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id"),
  CONSTRAINT "appointment_reminder_patient_fk"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id")
);

CREATE INDEX "appointment_reminder_clinic_idx"
  ON "appointment_reminder"("clinic_id");
CREATE INDEX "appointment_reminder_appointment_idx"
  ON "appointment_reminder"("appointment_id");
CREATE INDEX "appointment_reminder_scheduled_status_idx"
  ON "appointment_reminder"("scheduled_at", "status");

CREATE TABLE "clinic_reminder_config" (
  "id"               UUID        NOT NULL,
  "clinic_id"        UUID        NOT NULL,
  "enabled_channels" "reminder_channel"[] NOT NULL DEFAULT '{}',
  "hours_before_list" INTEGER[]  NOT NULL DEFAULT '{}',
  "is_active"        BOOLEAN     NOT NULL DEFAULT true,
  "created_at"       TIMESTAMP(3) NOT NULL,
  "updated_at"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "clinic_reminder_config_pk" PRIMARY KEY ("id"),
  CONSTRAINT "clinic_reminder_config_clinic_id_key" UNIQUE ("clinic_id"),
  CONSTRAINT "clinic_reminder_config_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id")
);
