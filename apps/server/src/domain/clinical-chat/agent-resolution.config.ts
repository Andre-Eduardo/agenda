import {Specialty} from '../form-template/entities';

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
    /** Tipo de profissão normalizado (enum Specialty). Vem do campo specialtyNormalized do Professional. */
    professionType: Specialty;
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
 * - Nível específico (priority ≥ 10): profissão + texto da especialidade → agente especialista
 * - Nível padrão (priority = 1): profissão → agente padrão da área
 *
 * Para adicionar um novo agente especialista:
 * 1. Certifique-se de que o `agentCode` existe em AiAgentProfile (seed ou DB).
 * 2. Adicione uma regra com `priority: 10` e o `specialtyTextPattern` normalizado.
 */
export const AGENT_MAPPING_RULES: AgentMappingRule[] = [
    // ─── Medicina — especialidades específicas (prioridade alta) ─────────────────
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'neurologia',
        agentCode: 'neurologia',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'psiquiatria',
        agentCode: 'psiquiatria',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'pediatria',
        agentCode: 'pediatria',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'medicina familiar',
        agentCode: 'medicina_familiar',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'medicina de familia',
        agentCode: 'medicina_familiar',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.MEDICINA,
        specialtyTextPattern: 'medicina de familia e comunidade',
        agentCode: 'medicina_familiar',
        isActive: true,
        priority: 10,
    },

    // ─── Medicina — padrão para médico geral ────────────────────────────────────
    {
        professionType: Specialty.MEDICINA,
        agentCode: 'medico_geral',
        isActive: true,
        priority: 1,
    },

    // ─── Psicologia — especialidades específicas ─────────────────────────────────
    {
        professionType: Specialty.PSICOLOGIA,
        specialtyTextPattern: 'neuropsicologia',
        agentCode: 'neuropsicologia',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.PSICOLOGIA,
        specialtyTextPattern: 'psicopedagogia',
        agentCode: 'psicopedagogia',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.PSICOLOGIA,
        specialtyTextPattern: 'psicologia do desenvolvimento',
        agentCode: 'psicologia_desenvolvimento',
        isActive: true,
        priority: 10,
    },
    {
        professionType: Specialty.PSICOLOGIA,
        specialtyTextPattern: 'psicologia desenvolvimento',
        agentCode: 'psicologia_desenvolvimento',
        isActive: true,
        priority: 10,
    },

    // ─── Psicologia — padrão para psicólogo clínico ─────────────────────────────
    {
        professionType: Specialty.PSICOLOGIA,
        agentCode: 'psicologia_clinica',
        isActive: true,
        priority: 1,
    },

    // ─── Fisioterapia ────────────────────────────────────────────────────────────
    {
        professionType: Specialty.FISIOTERAPIA,
        agentCode: 'fisioterapia',
        isActive: true,
        priority: 1,
    },

    // ─── Nutrição ────────────────────────────────────────────────────────────────
    {
        professionType: Specialty.NUTRICAO,
        agentCode: 'nutricao',
        isActive: true,
        priority: 1,
    },

    // ─── Demais especialidades → agente genérico ─────────────────────────────────
    {
        professionType: Specialty.FONOAUDIOLOGIA,
        agentCode: 'agente_generico',
        isActive: true,
        priority: 1,
    },
    {
        professionType: Specialty.TERAPIA_OCUPACIONAL,
        agentCode: 'agente_generico',
        isActive: true,
        priority: 1,
    },
    {
        professionType: Specialty.ENFERMAGEM,
        agentCode: 'agente_generico',
        isActive: true,
        priority: 1,
    },
    {
        professionType: Specialty.OUTROS,
        agentCode: 'agente_generico',
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
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
        .replace(/[^a-z0-9\s]/g, ' ')    // remove pontuação, mantém espaços
        .replace(/\s+/g, ' ')            // colapsa espaços múltiplos
        .trim();
}
