-- Triagem antes da chamada (configuração da clínica + dados por atendimento)
ALTER TABLE "clinic" ADD COLUMN "triage_required" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "appointment_triage" (
    "appointment_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "height_cm" INTEGER,
    "systolic_pressure" INTEGER,
    "diastolic_pressure" INTEGER,
    "heart_rate" INTEGER,
    "temperature_celsius" DECIMAL(4,1),
    "oxygen_saturation" INTEGER,
    "notes" VARCHAR(1000),
    "released_at" TIMESTAMP(3),
    "released_by_member_id" UUID,
    "updated_by_member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_triage_pkey" PRIMARY KEY ("appointment_id")
);

CREATE INDEX "appointment_triage_clinic_id_idx" ON "appointment_triage"("clinic_id");

ALTER TABLE "appointment_triage" ADD CONSTRAINT "appointment_triage_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_triage" ADD CONSTRAINT "appointment_triage_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
