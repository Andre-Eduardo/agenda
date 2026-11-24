-- Pacotes de IA e licença da clínica. Sem backfill: toda clínica começa no
-- sistema base (sem pacotes); quem não tem linha em clinic_license usa os
-- limites padrão do domínio.

CREATE TYPE "clinic_module_type" AS ENUM ('AI_CHAT', 'AI_AGENT', 'AI_FORMS', 'AI_DOCUMENT_IMPORT');

CREATE TABLE "clinic_license" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "included_professionals" INTEGER NOT NULL DEFAULT 1,
    "extra_professionals" INTEGER NOT NULL DEFAULT 0,
    "max_professionals" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_license_pk" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinic_license_clinic_unique" ON "clinic_license"("clinic_id");

ALTER TABLE "clinic_license"
    ADD CONSTRAINT "clinic_license_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "clinic_license_module" (
    "id" UUID NOT NULL,
    "license_id" UUID NOT NULL,
    "module_type" "clinic_module_type" NOT NULL,
    "included_seats" INTEGER NOT NULL,
    "extra_seats" INTEGER NOT NULL DEFAULT 0,
    "max_seats" INTEGER,
    CONSTRAINT "clinic_license_module_pk" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinic_license_module_unique" ON "clinic_license_module"("license_id", "module_type");

ALTER TABLE "clinic_license_module"
    ADD CONSTRAINT "clinic_license_module_license_id_fkey"
    FOREIGN KEY ("license_id") REFERENCES "clinic_license"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "clinic_module_assignment" (
    "id" UUID NOT NULL,
    "license_id" UUID NOT NULL,
    "clinic_member_id" UUID NOT NULL,
    "module_type" "clinic_module_type" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_module_assignment_pk" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinic_module_assignment_unique" ON "clinic_module_assignment"("clinic_member_id", "module_type");
CREATE INDEX "clinic_module_assignment_license_idx" ON "clinic_module_assignment"("license_id");

ALTER TABLE "clinic_module_assignment"
    ADD CONSTRAINT "clinic_module_assignment_license_id_fkey"
    FOREIGN KEY ("license_id") REFERENCES "clinic_license"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinic_module_assignment"
    ADD CONSTRAINT "clinic_module_assignment_clinic_member_id_fkey"
    FOREIGN KEY ("clinic_member_id") REFERENCES "clinic_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
