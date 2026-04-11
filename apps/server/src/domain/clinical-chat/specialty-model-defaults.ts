import type {Specialty} from '../form-template/entities';

/**
 * Modelos padrão por grupo de especialidade clínica.
 *
 * Cada entrada define o modelo OpenRouter a ser usado quando o AgentProfile
 * não tem um `providerModelId` explícito. Os valores devem ser IDs válidos no
 * formato "provider/model" aceito pelo OpenRouter.
 *
 * Regras:
 * - O valor "openrouter/auto" NUNCA deve aparecer aqui — o roteamento automático
 *   não é permitido em fluxos clínicos (custo e comportamento imprevisíveis).
 * - Ao adicionar novos modelos, verifique disponibilidade em https://openrouter.ai/models
 */
export const SPECIALTY_MODEL_DEFAULTS: Record<Specialty | 'generic', string> = {
    // Psicologia: modelo com alta capacidade de empatia e raciocínio contextual longo
    PSICOLOGIA: 'anthropic/claude-3.5-sonnet',

    // Medicina geral: modelo com bom raciocínio clínico e custo controlado
    MEDICINA: 'openai/o1-mini',

    // Demais especialidades: modelo custo-benefício equilibrado
    FISIOTERAPIA: 'openai/gpt-4o-mini',
    FONOAUDIOLOGIA: 'openai/gpt-4o-mini',
    NUTRICAO: 'openai/gpt-4o-mini',
    TERAPIA_OCUPACIONAL: 'openai/gpt-4o-mini',
    ENFERMAGEM: 'openai/gpt-4o-mini',
    OUTROS: 'openai/gpt-4o-mini',

    // Agente genérico (specialty = null)
    generic: 'openai/gpt-4o-mini',
};

/**
 * Retorna o modelo padrão para a especialidade dada.
 * Quando `specialty` é null, retorna o modelo do agente genérico.
 */
export function getDefaultModelForSpecialty(specialty: Specialty | null): string {
    if (specialty === null) {
        return SPECIALTY_MODEL_DEFAULTS.generic;
    }
    return SPECIALTY_MODEL_DEFAULTS[specialty] ?? SPECIALTY_MODEL_DEFAULTS.generic;
}
