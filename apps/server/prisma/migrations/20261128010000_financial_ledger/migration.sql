-- Livro-caixa da clínica (docs/financial-ledger.md).

-- AlterEnum
ALTER TYPE "payment_method" ADD VALUE 'MIXED';

-- CreateEnum
CREATE TYPE "financial_account_type" AS ENUM ('CASH_DRAWER', 'BANK', 'CARD_MACHINE', 'DIGITAL_WALLET');

-- CreateEnum
CREATE TYPE "financial_entry_direction" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "financial_entry_origin_type" AS ENUM ('APPOINTMENT');

-- CreateEnum
CREATE TYPE "account_movement_direction" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "account_movement_category" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "financial_account" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "financial_account_type" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "financial_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entry" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "direction" "financial_entry_direction" NOT NULL,
    "origin_type" "financial_entry_origin_type" NOT NULL,
    "appointment_payment_id" UUID,
    "description" VARCHAR(255) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "competency_date" TIMESTAMP(3) NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_movement" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "direction" "account_movement_direction" NOT NULL,
    "category" "account_movement_category" NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "moved_at" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(500),
    "reverses_movement_id" UUID,
    "responsible_member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_account_clinic_type_idx" ON "financial_account"("clinic_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entry_appointment_payment_id_key" ON "financial_entry"("appointment_payment_id");

-- CreateIndex
CREATE INDEX "financial_entry_clinic_competency_idx" ON "financial_entry"("clinic_id", "competency_date");

-- CreateIndex
CREATE INDEX "account_movement_entry_idx" ON "account_movement"("entry_id");

-- CreateIndex
CREATE INDEX "account_movement_account_moved_at_idx" ON "account_movement"("account_id", "moved_at");

-- CreateIndex
CREATE INDEX "account_movement_clinic_moved_at_idx" ON "account_movement"("clinic_id", "moved_at");

-- AddForeignKey
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry" ADD CONSTRAINT "financial_entry_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry" ADD CONSTRAINT "financial_entry_appointment_payment_id_fkey" FOREIGN KEY ("appointment_payment_id") REFERENCES "appointment_payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry" ADD CONSTRAINT "financial_entry_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_movement" ADD CONSTRAINT "account_movement_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_movement" ADD CONSTRAINT "account_movement_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "financial_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_movement" ADD CONSTRAINT "account_movement_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_movement" ADD CONSTRAINT "account_movement_responsible_member_id_fkey" FOREIGN KEY ("responsible_member_id") REFERENCES "clinic_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Uma conta padrão por tipo e clínica.
CREATE UNIQUE INDEX "financial_account_default_per_type_key" ON "financial_account"("clinic_id", "type") WHERE "is_default" AND "deleted_at" IS NULL;

-- Movimentos são valores positivos; a direção diz se entra ou sai.
ALTER TABLE "account_movement" ADD CONSTRAINT "account_movement_amount_positive" CHECK ("amount_cents" > 0);
ALTER TABLE "financial_entry" ADD CONSTRAINT "financial_entry_amount_non_negative" CHECK ("amount_cents" >= 0);

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Contas padrão para todas as clínicas.
INSERT INTO "financial_account" ("id", "clinic_id", "name", "type", "active", "is_default", "created_at", "updated_at")
SELECT gen_random_uuid(), c."id", v."name", v."type"::"financial_account_type", true, true, now(), now()
FROM "clinic" c
CROSS JOIN (VALUES ('Caixa', 'CASH_DRAWER'), ('Conta bancária', 'BANK'), ('Maquininha', 'CARD_MACHINE')) AS v("name", "type");

-- Uma obrigação por pagamento direto já registrado.
INSERT INTO "financial_entry" ("id", "clinic_id", "direction", "origin_type", "appointment_payment_id", "description", "amount_cents", "competency_date", "created_by_member_id", "created_at", "updated_at")
SELECT gen_random_uuid(), p."clinic_id", 'RECEIVABLE', 'APPOINTMENT', p."id", 'Atendimento', ROUND(p."amount_brl" * 100)::int, a."start_at", p."registered_by_member_id", p."created_at", p."updated_at"
FROM "appointment_payment" p
JOIN "appointment" a ON a."id" = p."appointment_id"
WHERE p."deleted_at" IS NULL
  AND p."payment_method" IN ('CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER');

-- Entrada do valor pago (pagos e estornados que chegaram a ser pagos).
INSERT INTO "account_movement" ("id", "clinic_id", "entry_id", "account_id", "direction", "category", "payment_method", "amount_cents", "moved_at", "responsible_member_id", "created_at")
SELECT gen_random_uuid(), e."clinic_id", e."id", fa."id", 'IN', 'PAYMENT', p."payment_method", e."amount_cents", COALESCE(p."paid_at", p."created_at"), p."registered_by_member_id", now()
FROM "financial_entry" e
JOIN "appointment_payment" p ON p."id" = e."appointment_payment_id"
JOIN "financial_account" fa ON fa."clinic_id" = e."clinic_id" AND fa."is_default" AND fa."type" = (
    CASE p."payment_method"
        WHEN 'CASH' THEN 'CASH_DRAWER'
        WHEN 'CREDIT_CARD' THEN 'CARD_MACHINE'
        WHEN 'DEBIT_CARD' THEN 'CARD_MACHINE'
        ELSE 'BANK'
    END
)::"financial_account_type"
WHERE e."amount_cents" > 0
  AND (p."status" = 'PAID' OR (p."status" = 'REFUNDED' AND p."paid_at" IS NOT NULL));

-- Saída do estorno para os já estornados.
INSERT INTO "account_movement" ("id", "clinic_id", "entry_id", "account_id", "direction", "category", "payment_method", "amount_cents", "moved_at", "reason", "reverses_movement_id", "responsible_member_id", "created_at")
SELECT gen_random_uuid(), m."clinic_id", m."entry_id", m."account_id", 'OUT', 'REFUND', m."payment_method", m."amount_cents", GREATEST(p."updated_at", m."moved_at"), 'Estorno anterior ao livro-caixa', m."id", m."responsible_member_id", now()
FROM "account_movement" m
JOIN "financial_entry" e ON e."id" = m."entry_id"
JOIN "appointment_payment" p ON p."id" = e."appointment_payment_id"
WHERE p."status" = 'REFUNDED';
