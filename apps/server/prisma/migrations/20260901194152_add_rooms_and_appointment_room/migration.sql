-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "room_id" UUID;

-- AlterTable
ALTER TABLE "clinic" ADD COLUMN     "room_management_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "professional" ADD COLUMN     "default_room_id" UUID;

-- CreateTable
CREATE TABLE "room" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "room_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_clinic_idx" ON "room"("clinic_id");

-- CreateIndex
CREATE INDEX "appointment_room_idx" ON "appointment"("room_id");

-- AddForeignKey
ALTER TABLE "professional" ADD CONSTRAINT "professional_default_room_id_fkey" FOREIGN KEY ("default_room_id") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
