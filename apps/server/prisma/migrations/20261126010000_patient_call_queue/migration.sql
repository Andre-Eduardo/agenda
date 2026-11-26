-- CreateTable
CREATE TABLE "patient_call_panel" (
    "clinic_id" UUID NOT NULL,
    "public_token" CHAR(64),
    "enabled_at" TIMESTAMP(3),
    "title" VARCHAR(80) NOT NULL,
    "message" VARCHAR(160) NOT NULL,
    "foreground_color" CHAR(7) NOT NULL,
    "background_color" CHAR(7) NOT NULL,
    "use_clinic_logo" BOOLEAN NOT NULL,
    "sound_enabled" BOOLEAN NOT NULL,
    "display_seconds" INTEGER NOT NULL,
    "next_ticket" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "patient_call_panel_pkey" PRIMARY KEY ("clinic_id")
);

-- CreateTable
CREATE TABLE "patient_call_entry" (
    "appointment_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "ticket" INTEGER NOT NULL,
    "arrived_at" TIMESTAMP(3) NOT NULL,
    "call_count" INTEGER NOT NULL DEFAULT 0,
    "destination" VARCHAR(80),
    "closed_at" TIMESTAMP(3),
    "removal_reason" VARCHAR(250),
    "removed_by_member_id" UUID,

    CONSTRAINT "patient_call_entry_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "patient_call_announcement" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "actor_member_id" UUID NOT NULL,
    "destination" VARCHAR(80) NOT NULL,
    "announced_at" TIMESTAMP(3) NOT NULL,
    "visible_from" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_call_announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_call_panel_public_token_key" ON "patient_call_panel"("public_token");

-- CreateIndex
CREATE INDEX "patient_call_entry_clinic_id_closed_at_arrived_at_ticket_idx" ON "patient_call_entry"("clinic_id", "closed_at", "arrived_at", "ticket");

-- CreateIndex
CREATE UNIQUE INDEX "patient_call_entry_clinic_id_ticket_key" ON "patient_call_entry"("clinic_id", "ticket");

-- CreateIndex
CREATE INDEX "patient_call_announcement_clinic_id_visible_from_idx" ON "patient_call_announcement"("clinic_id", "visible_from");

-- CreateIndex
CREATE INDEX "patient_call_announcement_appointment_id_idx" ON "patient_call_announcement"("appointment_id");

-- AddForeignKey
ALTER TABLE "patient_call_panel" ADD CONSTRAINT "patient_call_panel_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_call_entry" ADD CONSTRAINT "patient_call_entry_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_call_entry" ADD CONSTRAINT "patient_call_entry_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "patient_call_panel"("clinic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_call_announcement" ADD CONSTRAINT "patient_call_announcement_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "patient_call_panel"("clinic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_call_announcement" ADD CONSTRAINT "patient_call_announcement_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "patient_call_entry"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;
