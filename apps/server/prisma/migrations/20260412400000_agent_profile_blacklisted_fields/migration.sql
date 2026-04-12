-- ─── Task 14: Adicionar blacklisted_fields ao AiAgentProfile ─────────────────
-- Adiciona coluna `blacklisted_fields` ao perfil de agente clínico.
--
-- Permite definir por agente quais campos de PatientFacts devem ser removidos
-- antes de montar o prompt enviado ao LLM — ex: campos administrativos como
-- documentId que não têm relevância clínica para determinadas especialidades.
--
-- IMPACTO: linhas existentes recebem array vazio (sem restrição de campos)
-- como default, preservando o comportamento atual de todos os agentes.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE ai_agent_profile
    ADD COLUMN IF NOT EXISTS blacklisted_fields TEXT[] NOT NULL DEFAULT '{}';
