-- Tipo de conta da clínica: SOLO (autônomo) ou CLINIC (com equipe).
CREATE TYPE "clinic_account_type" AS ENUM ('SOLO', 'CLINIC');

ALTER TABLE "clinic"
    ADD COLUMN "account_type" "clinic_account_type" NOT NULL DEFAULT 'CLINIC',
    ADD COLUMN "reception_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Contas que já eram "consultório individual" e têm no máximo um membro de verdade
-- (vínculos de suporte não contam) viram SOLO, sem recepção. As demais continuam
-- CLINIC com tudo ligado, para nenhuma clínica perder tela.
UPDATE "clinic" c
SET "account_type" = 'SOLO', "reception_enabled" = false
WHERE c."is_personal_clinic" = true
  AND (
    SELECT count(*) FROM "clinic_member" m
    WHERE m."clinic_id" = c."id" AND m."support_access" = false AND m."deleted_at" IS NULL
  ) <= 1;

ALTER TABLE "clinic" DROP COLUMN "is_personal_clinic";
