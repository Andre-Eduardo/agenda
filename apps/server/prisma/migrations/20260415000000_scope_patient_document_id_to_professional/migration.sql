-- Multi-tenancy fix: scope unique constraints to professional (tenant)
--
-- Problem: The old global unique constraints allowed data leakage between
-- professionals sharing the same database. A patient's document ID must only
-- be unique within a professional's workspace, not globally.
--
-- Changes:
--   1. Drop the global unique constraint on person.document_id
--      (person rows are created per-patient per-professional, so global uniqueness is wrong)
--   2. Drop the global unique constraint on patient.document_id
--   3. Add a per-professional unique constraint: (document_id, professional_id) on patient

-- 1. Remove global unique on person.document_id
DROP INDEX IF EXISTS "person_document_id_key";

-- 2. Remove global unique on patient.document_id
DROP INDEX IF EXISTS "patient_document_id_key";

-- 3. Add scoped unique: a professional cannot register the same document_id twice
CREATE UNIQUE INDEX "patient_document_id_professional_key" ON "patient"("document_id", "professional_id");
