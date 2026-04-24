-- CreateEnum: agent_proposal_type
CREATE TYPE "agent_proposal_type" AS ENUM ('APPOINTMENT', 'APPOINTMENT_CANCEL', 'APPOINTMENT_RESCHEDULE', 'PATIENT_ALERT');

-- CreateEnum: agent_proposal_status
CREATE TYPE "agent_proposal_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- CreateTable: agent_proposal
-- Stores AI agent proposals that require human confirmation before executing mutations.
CREATE TABLE "agent_proposal" (
    "id"               UUID                    NOT NULL,
    "session_id"       UUID,
    "message_id"       UUID,
    "patient_id"       UUID,
    "professional_id"  UUID                    NOT NULL,
    "type"             "agent_proposal_type"   NOT NULL,
    "status"           "agent_proposal_status" NOT NULL DEFAULT 'PENDING',
    "payload"          JSONB                   NOT NULL,
    "preview"          JSONB                   NOT NULL,
    "rationale"        TEXT,
    "confidence"       DOUBLE PRECISION,
    "result_entity_id" UUID,
    "expires_at"       TIMESTAMP(3),
    "confirmed_at"     TIMESTAMP(3),
    "confirmed_by"     UUID,
    "rejected_at"      TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at"       TIMESTAMP(3)            NOT NULL,
    "updated_at"       TIMESTAMP(3)            NOT NULL,

    CONSTRAINT "agent_proposal_pk" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agent_proposal" ADD CONSTRAINT "agent_proposal_professional_fk"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "agent_proposal_professional_status_idx" ON "agent_proposal"("professional_id", "status");
CREATE INDEX "agent_proposal_patient_idx"             ON "agent_proposal"("patient_id");
