-- Migration: clinic_address_logo_specialties
--
-- Adiciona ao modelo Clinic:
--   - Campos de endereço (street, number, complement, neighborhood, city, state, zip_code, country)
--   - URL da logo (logo_url)
--   - Array de especialidades atendidas (clinic_specialties)

-- AlterTable
ALTER TABLE "clinic"
  ADD COLUMN "street"            TEXT,
  ADD COLUMN "number"            TEXT,
  ADD COLUMN "complement"        TEXT,
  ADD COLUMN "neighborhood"      TEXT,
  ADD COLUMN "city"              TEXT,
  ADD COLUMN "state"             TEXT,
  ADD COLUMN "zip_code"          TEXT,
  ADD COLUMN "country"           TEXT DEFAULT 'BR',
  ADD COLUMN "logo_url"          TEXT,
  ADD COLUMN "clinic_specialties" "specialty"[] NOT NULL DEFAULT '{}';
