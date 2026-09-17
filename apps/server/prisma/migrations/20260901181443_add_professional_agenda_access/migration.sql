-- CreateTable
CREATE TABLE "professional_agenda_access" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "grantee_member_id" UUID NOT NULL,
    "professional_member_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "professional_agenda_access_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_agenda_access_clinic_idx" ON "professional_agenda_access"("clinic_id");

-- CreateIndex
CREATE INDEX "professional_agenda_access_professional_idx" ON "professional_agenda_access"("professional_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_agenda_access_grantee_member_id_professional_m_key" ON "professional_agenda_access"("grantee_member_id", "professional_member_id");

-- AddForeignKey
ALTER TABLE "professional_agenda_access" ADD CONSTRAINT "professional_agenda_access_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_agenda_access" ADD CONSTRAINT "professional_agenda_access_grantee_member_id_fkey" FOREIGN KEY ("grantee_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_agenda_access" ADD CONSTRAINT "professional_agenda_access_professional_member_id_fkey" FOREIGN KEY ("professional_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
