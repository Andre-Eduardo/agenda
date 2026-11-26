CREATE TYPE "procedure_color" AS ENUM ('BLUE', 'GREEN', 'AMBER', 'RED');
CREATE TYPE "procedure_modality" AS ENUM ('IN_PERSON', 'REMOTE');

CREATE TABLE "procedure" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "color" "procedure_color" NOT NULL,
    "price_in_cents" INTEGER NOT NULL,
    "modality" "procedure_modality" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "procedure_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "procedure_clinic_id_fkey" FOREIGN KEY ("clinic_id")
        REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "procedure_duration_check" CHECK ("duration_minutes" BETWEEN 1 AND 720),
    CONSTRAINT "procedure_price_check" CHECK ("price_in_cents" >= 0)
);

CREATE UNIQUE INDEX "procedure_clinic_id_id_key" ON "procedure"("clinic_id", "id");
CREATE INDEX "procedure_clinic_id_active_name_idx" ON "procedure"("clinic_id", "active", "name");

ALTER TABLE "appointment"
    ADD COLUMN "procedure_id" UUID,
    ADD COLUMN "procedure_name" VARCHAR(120),
    ADD COLUMN "procedure_color" "procedure_color",
    ADD COLUMN "procedure_price_in_cents" INTEGER,
    ADD COLUMN "procedure_modality" "procedure_modality",
    ADD CONSTRAINT "appointment_clinic_id_procedure_id_fkey" FOREIGN KEY ("clinic_id", "procedure_id")
        REFERENCES "procedure"("clinic_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "appointment_procedure_snapshot_check" CHECK (
        num_nonnulls("procedure_id", "procedure_name", "procedure_color", "procedure_price_in_cents", "procedure_modality") IN (0, 5)
        AND ("procedure_price_in_cents" IS NULL OR "procedure_price_in_cents" >= 0)
    );

CREATE INDEX "appointment_clinic_id_procedure_id_idx" ON "appointment"("clinic_id", "procedure_id");
