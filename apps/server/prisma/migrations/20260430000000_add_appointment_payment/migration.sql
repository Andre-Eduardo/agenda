-- Migration: Add PaymentMethod, AppointmentPaymentStatus enums and AppointmentPayment table.

CREATE TYPE "payment_method" AS ENUM (
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'INSURANCE',
  'COURTESY'
);

CREATE TYPE "appointment_payment_status" AS ENUM (
  'PENDING',
  'PAID',
  'EXEMPT',
  'REFUNDED'
);

CREATE TABLE "appointment_payment" (
  "id"                     UUID           NOT NULL,
  "clinic_id"              UUID           NOT NULL,
  "appointment_id"         UUID           NOT NULL,
  "patient_id"             UUID           NOT NULL,
  "registered_by_member_id" UUID          NOT NULL,
  "payment_method"         "payment_method" NOT NULL,
  "status"                 "appointment_payment_status" NOT NULL DEFAULT 'PENDING',
  "amount_brl"             DOUBLE PRECISION NOT NULL,
  "paid_at"                TIMESTAMP(3),
  "insurance_plan_id"      UUID,
  "insurance_auth_code"    TEXT,
  "notes"                  TEXT,
  "created_at"             TIMESTAMP(3)   NOT NULL,
  "updated_at"             TIMESTAMP(3)   NOT NULL,

  CONSTRAINT "appointment_payment_pk" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_payment_appointment_fk"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id"),
  CONSTRAINT "appointment_payment_clinic_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id"),
  CONSTRAINT "appointment_payment_patient_fk"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id"),
  CONSTRAINT "appointment_payment_registered_by_fk"
    FOREIGN KEY ("registered_by_member_id") REFERENCES "clinic_member"("id"),
  CONSTRAINT "appointment_payment_insurance_plan_fk"
    FOREIGN KEY ("insurance_plan_id") REFERENCES "insurance_plan"("id")
);

CREATE UNIQUE INDEX "appointment_payment_appointment_id_key"
  ON "appointment_payment"("appointment_id");

CREATE INDEX "appointment_payment_clinic_idx"
  ON "appointment_payment"("clinic_id");

CREATE INDEX "appointment_payment_patient_idx"
  ON "appointment_payment"("patient_id");

CREATE INDEX "appointment_payment_paid_at_idx"
  ON "appointment_payment"("paid_at");
