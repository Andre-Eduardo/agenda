-- Migration: Add cost_usd column to clinical_chat_interaction_log
-- Stores the calculated USD cost of each AI interaction based on static model pricing.
-- null = model not in pricing table or interaction predates billing.

ALTER TABLE "clinical_chat_interaction_log"
  ADD COLUMN "cost_usd" DOUBLE PRECISION;
