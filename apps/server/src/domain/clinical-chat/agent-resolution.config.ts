import { AiSpecialtyGroup } from "@domain/form-template/entities";

/**
 * Regra de mapeamento entre perfil profissional e agente clínico.
 *
 * A resolução segue a ordem:
 * 1. Correspondência por `professionType` + `specialtyTextPattern` (prioridade alta)
 * 2. Correspondência por `professionType` apenas (fallback por profissão)
 * 3. Agente genérico (specialty = null)
 * 4. Erro controlado (se nenhuma regra existir)
 */
export type AgentMappingRule = {
  /** Grupo de especialidade normalizado (AiSpecialtyGroup). Vem do campo specialtyNormalized do Professional. */
  professionType: AiSpecialtyGroup;
  /**
   * Padrão de texto normalizado da especialidade específica (lowercase, sem acentos).
   * Quando presente, é comparado com o campo `specialty` do Professional (normalizado).
   * Exemplos: "neurologia", "psicopedagogia", "medicina familiar".
   */
  specialtyTextPattern?: string;
  /** Código do agente a usar — deve corresponder ao campo `code` de AiAgentProfile. */
  agentCode: string;
  isActive: boolean;
  /** Prioridade de avaliação. Maior = verificado primeiro. */
  priority: number;
};

/**
 * Regras de mapeamento estáticas: perfil do profissional → agente clínico.
 *
 * Estrutura em dois níveis:
 * - Nível específico (priority ≥ 10): grupo + texto da especialidade → agente especialista
 * - Nível padrão (priority = 1): grupo → agente padrão da área
 *
 * Para adicionar um novo agente especialista:
 * 1. Certifique-se de que o `agentCode` existe em AiAgentProfile (seed ou DB).
 * 2. Adicione uma regra com `priority: 10` e o `specialtyTextPattern` normalizado.
 */
export const AGENT_MAPPING_RULES: AgentMappingRule[] = [
  // ─── Medicina Geral — especialidades específicas (prioridade alta) ───────────
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    specialtyTextPattern: "neurologia",
    agentCode: "neurologia",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    specialtyTextPattern: "pediatria",
    agentCode: "pediatria",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    specialtyTextPattern: "medicina familiar",
    agentCode: "medicina_familiar",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    specialtyTextPattern: "medicina de familia",
    agentCode: "medicina_familiar",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    specialtyTextPattern: "medicina de familia e comunidade",
    agentCode: "medicina_familiar",
    isActive: true,
    priority: 10,
  },

  // ─── Medicina Especializada — especialidades específicas ─────────────────────
  {
    professionType: AiSpecialtyGroup.MEDICINA_ESPECIALIZADA,
    specialtyTextPattern: "neurologia",
    agentCode: "neurologia",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.MEDICINA_ESPECIALIZADA,
    specialtyTextPattern: "psiquiatria",
    agentCode: "psiquiatria",
    isActive: true,
    priority: 10,
  },

  // ─── Medicina Geral — padrão ─────────────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.MEDICINA_GERAL,
    agentCode: "medico_geral",
    isActive: true,
    priority: 1,
  },

  // ─── Medicina Especializada — padrão ─────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.MEDICINA_ESPECIALIZADA,
    agentCode: "medico_geral",
    isActive: true,
    priority: 1,
  },

  // ─── Saúde Mental — especialidades específicas ───────────────────────────────
  {
    professionType: AiSpecialtyGroup.SAUDE_MENTAL,
    specialtyTextPattern: "neuropsicologia",
    agentCode: "neuropsicologia",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.SAUDE_MENTAL,
    specialtyTextPattern: "psicopedagogia",
    agentCode: "psicopedagogia",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.SAUDE_MENTAL,
    specialtyTextPattern: "psicologia do desenvolvimento",
    agentCode: "psicologia_desenvolvimento",
    isActive: true,
    priority: 10,
  },
  {
    professionType: AiSpecialtyGroup.SAUDE_MENTAL,
    specialtyTextPattern: "psicologia desenvolvimento",
    agentCode: "psicologia_desenvolvimento",
    isActive: true,
    priority: 10,
  },

  // ─── Saúde Mental — padrão ───────────────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.SAUDE_MENTAL,
    agentCode: "psicologia_clinica",
    isActive: true,
    priority: 1,
  },

  // ─── Reabilitação (fisioterapia, fonoaudiologia, TO) ─────────────────────────
  {
    professionType: AiSpecialtyGroup.REABILITACAO,
    agentCode: "fisioterapia",
    isActive: true,
    priority: 1,
  },

  // ─── Nutrição e Dietética ────────────────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.NUTRICAO_DIETETICA,
    agentCode: "nutricao",
    isActive: true,
    priority: 1,
  },

  // ─── Enfermagem ──────────────────────────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.ENFERMAGEM,
    agentCode: "agente_generico",
    isActive: true,
    priority: 1,
  },

  // ─── Outros → agente genérico ────────────────────────────────────────────────
  {
    professionType: AiSpecialtyGroup.OUTROS,
    agentCode: "agente_generico",
    isActive: true,
    priority: 1,
  },
];

/**
 * Normaliza o texto de especialidade para comparação:
 * - Converte para minúsculas
 * - Remove acentos (diacríticos)
 * - Colapsa múltiplos espaços
 * - Remove pontuação irrelevante
 */
export function normalizeSpecialtyText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "") // remove diacríticos
    .replaceAll(/[^a-z0-9\s]/g, " ") // remove pontuação, mantém espaços
    .replaceAll(/\s+/g, " ") // colapsa espaços múltiplos
    .trim();
}
