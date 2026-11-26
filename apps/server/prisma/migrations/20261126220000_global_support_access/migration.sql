-- Usuário global de suporte: entra em qualquer clínica sem ser funcionário dela.
ALTER TYPE "global_role" ADD VALUE 'SUPPORT';

-- Vínculo técnico criado quando um usuário global entra numa clínica pelo suporte.
ALTER TABLE "clinic_member" ADD COLUMN "support_access" BOOLEAN NOT NULL DEFAULT false;
