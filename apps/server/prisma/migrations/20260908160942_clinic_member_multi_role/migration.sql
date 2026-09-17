-- Allow a ClinicMember to hold more than one role at once (e.g. OWNER + PROFESSIONAL,
-- ADMIN + PROFESSIONAL). Converts the single `role` enum column into a `roles` array,
-- backfilling every existing row with its current single role before dropping the old
-- column.

-- 1. Add the new nullable array column.
ALTER TABLE "clinic_member" ADD COLUMN "roles" "clinic_member_role"[];

-- 2. Backfill: each existing member keeps exactly their current role.
UPDATE "clinic_member" SET "roles" = ARRAY["role"]::"clinic_member_role"[];

-- 3. Enforce not-null now that every row has been backfilled.
ALTER TABLE "clinic_member" ALTER COLUMN "roles" SET NOT NULL;

-- 4. Drop the old single-role column.
ALTER TABLE "clinic_member" DROP COLUMN "role";
