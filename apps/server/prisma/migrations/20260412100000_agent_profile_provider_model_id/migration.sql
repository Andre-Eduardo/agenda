-- AlterTable
-- Adiciona campo provider_model_id à tabela ai_agent_profile.
-- Permite configurar um modelo fixo por agente (ex: "openai/o1-mini").
-- Quando NULL, o sistema usa o modelo padrão da especialidade (specialty-model-defaults).
ALTER TABLE "ai_agent_profile" ADD COLUMN "provider_model_id" TEXT;
