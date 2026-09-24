CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_member_id" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip" INET NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_clinic_time_idx" ON "audit_log"("clinic_id", "occurred_at" DESC);

-- The application role may append and read, but no normal SQL path may rewrite
-- or truncate history. Database superusers remain responsible for retention.
CREATE FUNCTION reject_audit_log_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_delete
    BEFORE UPDATE OR DELETE ON "audit_log"
    FOR EACH ROW EXECUTE FUNCTION reject_audit_log_mutation();

CREATE TRIGGER audit_log_no_truncate
    BEFORE TRUNCATE ON "audit_log"
    FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_log_mutation();
