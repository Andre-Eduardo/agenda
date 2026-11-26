-- DropIndex
DROP INDEX "patient_call_entry_clinic_id_closed_at_arrived_at_ticket_idx";

-- DropIndex
DROP INDEX "patient_call_entry_clinic_id_ticket_key";

-- AlterTable
ALTER TABLE "patient_call_panel" DROP COLUMN "next_ticket",
ADD COLUMN     "show_recent_calls" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "patient_call_entry" DROP COLUMN "ticket";

-- CreateIndex
CREATE INDEX "patient_call_entry_clinic_id_closed_at_arrived_at_appointme_idx" ON "patient_call_entry"("clinic_id", "closed_at", "arrived_at", "appointment_id");
