-- Aceite dos termos de uso no cadastro self-service do autônomo (LGPD).
ALTER TABLE "clinic"
    ADD COLUMN "terms_accepted_at" TIMESTAMP(3),
    ADD COLUMN "terms_version" TEXT;
