CREATE TABLE "appointment_status_transition" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_member_id" UUID NOT NULL,
    "from_status" "appointment_status" NOT NULL,
    "to_status" "appointment_status" NOT NULL,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointment_status_transition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_status_transition_lookup_idx"
    ON "appointment_status_transition"("clinic_id", "appointment_id", "occurred_at");
