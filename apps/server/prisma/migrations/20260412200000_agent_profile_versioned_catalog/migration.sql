-- AlterTable: Catálogo versionado de AgentProfiles
-- Adiciona campos para identificação programática, agrupamento por especialidade,
-- objetivos de análise, campos prioritários, guardrails e estilo de resposta.

ALTER TABLE "ai_agent_profile"
  ADD COLUMN "code"            TEXT,
  ADD COLUMN "specialty_group" TEXT,
  ADD COLUMN "priority_fields" JSONB,
  ADD COLUMN "analysis_goals"  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "guardrails"      TEXT,
  ADD COLUMN "response_style"  TEXT;

-- Índice único para code (quando preenchido)
CREATE UNIQUE INDEX "ai_agent_profile_code_key" ON "ai_agent_profile"("code") WHERE "code" IS NOT NULL;
