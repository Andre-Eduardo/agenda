import {AiSpecialtyGroup} from '../form-template/entities';

export const SPECIALTY_MODEL_DEFAULTS: Record<AiSpecialtyGroup | 'generic', string> = {
    [AiSpecialtyGroup.SAUDE_MENTAL]: 'anthropic/claude-3.5-sonnet',
    [AiSpecialtyGroup.MEDICINA_GERAL]: 'openai/o1-mini',
    [AiSpecialtyGroup.MEDICINA_ESPECIALIZADA]: 'openai/o1-mini',
    [AiSpecialtyGroup.REABILITACAO]: 'openai/gpt-4o-mini',
    [AiSpecialtyGroup.NUTRICAO_DIETETICA]: 'openai/gpt-4o-mini',
    [AiSpecialtyGroup.ENFERMAGEM]: 'openai/gpt-4o-mini',
    [AiSpecialtyGroup.OUTROS]: 'openai/gpt-4o-mini',
    generic: 'openai/gpt-4o-mini',
};

export function getDefaultModelForSpecialty(specialty: AiSpecialtyGroup | null): string {
    if (specialty === null) {
        return SPECIALTY_MODEL_DEFAULTS.generic;
    }

    return SPECIALTY_MODEL_DEFAULTS[specialty] ?? SPECIALTY_MODEL_DEFAULTS.generic;
}
