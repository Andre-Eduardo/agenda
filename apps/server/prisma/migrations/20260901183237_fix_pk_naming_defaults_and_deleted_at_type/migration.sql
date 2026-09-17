-- DropForeignKey
ALTER TABLE "appointment_payment" DROP CONSTRAINT "appointment_payment_appointment_fk";

-- DropForeignKey
ALTER TABLE "appointment_payment" DROP CONSTRAINT "appointment_payment_clinic_fk";

-- DropForeignKey
ALTER TABLE "appointment_payment" DROP CONSTRAINT "appointment_payment_insurance_plan_fk";

-- DropForeignKey
ALTER TABLE "appointment_payment" DROP CONSTRAINT "appointment_payment_patient_fk";

-- DropForeignKey
ALTER TABLE "appointment_payment" DROP CONSTRAINT "appointment_payment_registered_by_fk";

-- DropForeignKey
ALTER TABLE "appointment_reminder" DROP CONSTRAINT "appointment_reminder_appointment_fk";

-- DropForeignKey
ALTER TABLE "appointment_reminder" DROP CONSTRAINT "appointment_reminder_clinic_fk";

-- DropForeignKey
ALTER TABLE "appointment_reminder" DROP CONSTRAINT "appointment_reminder_patient_fk";

-- DropForeignKey
ALTER TABLE "clinic_reminder_config" DROP CONSTRAINT "clinic_reminder_config_clinic_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_appointment_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_clinic_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_created_by_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_file_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_patient_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_professional_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_record_fk";

-- DropForeignKey
ALTER TABLE "clinical_document" DROP CONSTRAINT "clinical_document_template_fk";

-- DropForeignKey
ALTER TABLE "clinical_document_template" DROP CONSTRAINT "clinical_document_template_clinic_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_approved_by_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_clinic_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_created_by_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_imported_doc_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_patient_fk";

-- DropForeignKey
ALTER TABLE "draft_evolution" DROP CONSTRAINT "draft_evolution_record_fk";

-- DropForeignKey
ALTER TABLE "member_block" DROP CONSTRAINT "member_block_clinic_fk";

-- DropForeignKey
ALTER TABLE "patient_chat_message" DROP CONSTRAINT "patient_chat_message_clinic_fk";

-- DropForeignKey
ALTER TABLE "professional_subscription" DROP CONSTRAINT "professional_subscription_clinic_fk";

-- DropForeignKey
ALTER TABLE "professional_subscription" DROP CONSTRAINT "professional_subscription_member_fk";

-- DropForeignKey
ALTER TABLE "record" DROP CONSTRAINT "record_signed_by_member_fk";

-- DropForeignKey
ALTER TABLE "record_amendment" DROP CONSTRAINT "record_amendment_clinic_fk";

-- DropForeignKey
ALTER TABLE "record_amendment" DROP CONSTRAINT "record_amendment_record_fk";

-- DropForeignKey
ALTER TABLE "record_amendment" DROP CONSTRAINT "record_amendment_requested_by_fk";

-- DropForeignKey
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_record_clinic_fk";

-- DropForeignKey
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_record_member_fk";

-- DropForeignKey
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_record_subscription_fk";

-- DropForeignKey
ALTER TABLE "working_hours" DROP CONSTRAINT "working_hours_clinic_fk";

-- NOTE: the two HNSW vector indexes (knowledge_chunk_embedding_hnsw_idx,
-- patient_context_chunk_embedding_hnsw_idx) are deliberately NOT dropped here.
-- Prisma v6 cannot represent HNSW indexes in schema.prisma, so `prisma migrate dev`
-- will always propose dropping them on every future diff — this is expected and
-- must be stripped from the generated SQL every time, not applied.

-- AlterTable
ALTER TABLE "appointment_payment" RENAME CONSTRAINT "appointment_payment_pk" TO "appointment_payment_pkey";
ALTER TABLE "appointment_payment" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "clinic_reminder_config" ALTER COLUMN "enabled_channels" DROP DEFAULT,
ALTER COLUMN "hours_before_list" DROP DEFAULT;

-- AlterTable
ALTER TABLE "clinical_document" RENAME CONSTRAINT "clinical_document_pk" TO "clinical_document_pkey";

-- AlterTable
ALTER TABLE "clinical_document_template" RENAME CONSTRAINT "clinical_document_template_pk" TO "clinical_document_template_pkey";

-- AlterTable
ALTER TABLE "draft_evolution" RENAME CONSTRAINT "draft_evolution_pk" TO "draft_evolution_pkey";
ALTER TABLE "draft_evolution" ALTER COLUMN "conduct_tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "member_block" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "record_amendment" RENAME CONSTRAINT "record_amendment_pk" TO "record_amendment_pkey";

-- AlterTable
ALTER TABLE "working_hours" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_registered_by_member_id_fkey" FOREIGN KEY ("registered_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payment" ADD CONSTRAINT "appointment_payment_insurance_plan_id_fkey" FOREIGN KEY ("insurance_plan_id") REFERENCES "insurance_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_block" ADD CONSTRAINT "member_block_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_signed_by_member_id_fkey" FOREIGN KEY ("signed_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_amendment" ADD CONSTRAINT "record_amendment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_amendment" ADD CONSTRAINT "record_amendment_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_amendment" ADD CONSTRAINT "record_amendment_requested_by_member_id_fkey" FOREIGN KEY ("requested_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_imported_document_id_fkey" FOREIGN KEY ("imported_document_id") REFERENCES "imported_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_approved_by_member_id_fkey" FOREIGN KEY ("approved_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_evolution" ADD CONSTRAINT "draft_evolution_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_message" ADD CONSTRAINT "patient_chat_message_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_chat_interaction_log" ADD CONSTRAINT "clinical_chat_interaction_log_user_message_id_fkey" FOREIGN KEY ("user_message_id") REFERENCES "patient_chat_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_chat_interaction_log" ADD CONSTRAINT "clinical_chat_interaction_log_assistant_message_id_fkey" FOREIGN KEY ("assistant_message_id") REFERENCES "patient_chat_message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "patient_chat_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "patient_chat_message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_confirmed_by_member_id_fkey" FOREIGN KEY ("confirmed_by_member_id") REFERENCES "clinic_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminder" ADD CONSTRAINT "appointment_reminder_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminder" ADD CONSTRAINT "appointment_reminder_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminder" ADD CONSTRAINT "appointment_reminder_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_reminder_config" ADD CONSTRAINT "clinic_reminder_config_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document_template" ADD CONSTRAINT "clinical_document_template_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_responsible_professional_id_fkey" FOREIGN KEY ("responsible_professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "clinical_document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_document" ADD CONSTRAINT "clinical_document_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscription" ADD CONSTRAINT "professional_subscription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscription" ADD CONSTRAINT "professional_subscription_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "professional_subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "draft_evolution_imported_doc_uniq" RENAME TO "draft_evolution_imported_document_id_key";

-- RenameIndex
ALTER INDEX "draft_evolution_record_uniq" RENAME TO "draft_evolution_record_id_key";

-- RenameIndex
ALTER INDEX "professional_subscription_member_unique" RENAME TO "professional_subscription_member_id_key";

-- RenameIndex
ALTER INDEX "subscription_addon_member_code_period_unique" RENAME TO "subscription_addon_member_id_addon_code_period_year_period__key";

-- RenameIndex
ALTER INDEX "usage_record_member_period_unique" RENAME TO "usage_record_member_id_period_year_period_month_key";
