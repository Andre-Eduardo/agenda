ALTER TABLE "appointment" ADD COLUMN "follow_up_from_record_id" UUID;

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_follow_up_from_record_id_fkey"
    FOREIGN KEY ("follow_up_from_record_id") REFERENCES "record"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "appointment_follow_up_source_idx" ON "appointment"("clinic_id", "follow_up_from_record_id");
