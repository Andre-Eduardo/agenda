-- Migration: Add ARRIVED and IN_PROGRESS to AppointmentStatus enum
-- and arrivedAt/calledAt fields to Appointment table
-- These fields are optional and backward-compatible.

ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

ALTER TABLE "appointment"
  ADD COLUMN IF NOT EXISTS "arrived_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "called_at"  TIMESTAMP(3);
