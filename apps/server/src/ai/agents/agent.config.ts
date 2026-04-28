import * as fs from 'fs';
import * as path from 'path';
import {AiSpecialtyGroup} from '../../domain/form-template/entities';

export type AgentConfig = {
    slug: string;
    name: string;
    /** Formato OpenRouter: provider/model-name */
    providerModelId: string;
    baseInstructions: string;
    guardrails: string;
    analysisGoals: string[];
    contextPriority: Record<string, number>;
    allowedSources: string[];
    maxTokens: number;
    temperature: number;
};

/** Carrega arquivo .md de prompt se existir, senão retorna null */
function loadPromptFile(name: string): string | null {
    const filePath = path.resolve(process.cwd(), `src/ai/agents/prompts/${name}.md`);

    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');

    return null;
}

const DEFAULT_GUARDRAILS =
    loadPromptFile('guardrails/default') ??
    `Você é um assistente clínico auxiliar.
- Nunca sugira diagnósticos definitivos ou substitua avaliação presencial.
- Não altere dados clínicos do paciente.
- Respostas sempre fundamentadas no contexto clínico fornecido.
- Em caso de dúvida, oriente o profissional a buscar mais informações.
- Nunca compartilhe dados de outros pacientes.`;

const DEFAULT_ALLOWED_SOURCES = ['RECORD', 'PATIENT_FORM', 'CLINICAL_PROFILE', 'PATIENT_ALERT'];

/**
 * Registry central de agentes clínicos.
 *
 * Cada entrada define um agente com seu modelo, instruções e parâmetros.
 * Variáveis de ambiente permitem substituição por ambiente sem migration.
 *
 * Modelo padrão: anthropic/claude-sonnet-4 (formato OpenRouter: provider/model)
 */
export const AGENT_REGISTRY = {
    'general-practitioner': {
        slug: 'general-practitioner',
        name: 'Clínico Geral',
        providerModelId: process.env.AGENT_GP_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('general-practitioner') ??
            'Você é um assistente clínico para médicos clínicos gerais. Apoie o profissional com análise contextual do paciente, identificando hipóteses diagnósticas, inconsistências e pontos relevantes para a consulta.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['resumo clínico', 'hipóteses diagnósticas', 'inconsistências'],
        contextPriority: {records: 1, alerts: 2, profile: 3, forms: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_GP_MAX_TOKENS ?? '1500'),
        temperature: parseFloat(process.env.AGENT_GP_TEMPERATURE ?? '0.3'),
    },

    psychologist: {
        slug: 'psychologist',
        name: 'Psicologia',
        providerModelId: process.env.AGENT_PSY_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('psychologist') ??
            'Você é um assistente clínico para psicólogos. Apoie o profissional com análise de histórico emocional, comportamental e relacional do paciente, identificando padrões relevantes para o acompanhamento psicológico.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['histórico emocional', 'padrões comportamentais', 'progresso terapêutico'],
        contextPriority: {records: 1, alerts: 2, forms: 3, profile: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_PSY_MAX_TOKENS ?? '1500'),
        temperature: parseFloat(process.env.AGENT_PSY_TEMPERATURE ?? '0.4'),
    },

    physiotherapist: {
        slug: 'physiotherapist',
        name: 'Fisioterapia',
        providerModelId: process.env.AGENT_PHYSIO_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('physiotherapist') ??
            'Você é um assistente clínico para fisioterapeutas. Apoie o profissional com análise de histórico funcional, evolução motora e aderência ao tratamento do paciente.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['evolução funcional', 'aderência ao tratamento', 'metas de reabilitação'],
        contextPriority: {records: 1, forms: 2, alerts: 3, profile: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_PHYSIO_MAX_TOKENS ?? '1200'),
        temperature: parseFloat(process.env.AGENT_PHYSIO_TEMPERATURE ?? '0.3'),
    },

    'speech-therapist': {
        slug: 'speech-therapist',
        name: 'Fonoaudiologia',
        providerModelId: process.env.AGENT_SPEECH_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('speech-therapist') ??
            'Você é um assistente clínico para fonoaudiólogos. Apoie o profissional com análise de histórico de linguagem, fala, deglutição e audição do paciente.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['evolução de linguagem', 'padrões de fala', 'progressão terapêutica'],
        contextPriority: {records: 1, forms: 2, alerts: 3, profile: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_SPEECH_MAX_TOKENS ?? '1200'),
        temperature: parseFloat(process.env.AGENT_SPEECH_TEMPERATURE ?? '0.3'),
    },

    nutritionist: {
        slug: 'nutritionist',
        name: 'Nutrição',
        providerModelId: process.env.AGENT_NUTRI_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('nutritionist') ??
            'Você é um assistente clínico para nutricionistas. Apoie o profissional com análise de histórico alimentar, evolução de indicadores nutricionais e aderência ao plano alimentar do paciente.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['evolução nutricional', 'aderência ao plano', 'indicadores antropométricos'],
        contextPriority: {forms: 1, records: 2, alerts: 3, profile: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_NUTRI_MAX_TOKENS ?? '1200'),
        temperature: parseFloat(process.env.AGENT_NUTRI_TEMPERATURE ?? '0.3'),
    },

    'occupational-therapist': {
        slug: 'occupational-therapist',
        name: 'Terapia Ocupacional',
        providerModelId: process.env.AGENT_OT_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('occupational-therapist') ??
            'Você é um assistente clínico para terapeutas ocupacionais. Apoie o profissional com análise de capacidade funcional, participação em atividades cotidianas e progressão da independência do paciente.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['capacidade funcional', 'participação em AVDs', 'progressão da independência'],
        contextPriority: {records: 1, forms: 2, alerts: 3, profile: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_OT_MAX_TOKENS ?? '1200'),
        temperature: parseFloat(process.env.AGENT_OT_TEMPERATURE ?? '0.3'),
    },

    nurse: {
        slug: 'nurse',
        name: 'Enfermagem',
        providerModelId: process.env.AGENT_NURSE_MODEL ?? 'anthropic/claude-sonnet-4',
        baseInstructions:
            loadPromptFile('nurse') ??
            'Você é um assistente clínico para enfermeiros. Apoie o profissional com análise de histórico de cuidados, controle de sinais vitais, medicação e aderência ao plano de cuidados do paciente.',
        guardrails: DEFAULT_GUARDRAILS,
        analysisGoals: ['monitoramento clínico', 'aderência ao tratamento', 'riscos assistenciais'],
        contextPriority: {alerts: 1, records: 2, profile: 3, forms: 4},
        allowedSources: DEFAULT_ALLOWED_SOURCES,
        maxTokens: parseInt(process.env.AGENT_NURSE_MAX_TOKENS ?? '1200'),
        temperature: parseFloat(process.env.AGENT_NURSE_TEMPERATURE ?? '0.3'),
    },
} as const satisfies Record<string, AgentConfig>;

/**
 * Mapeamento estático de especialidade clínica → slug de agente.
 *
 * Alterar AGENT_GP_MODEL=openai/gpt-4o no .env e reiniciar usa o novo modelo
 * sem migration ou alteração de código.
 */
export const SPECIALTY_AGENT_MAP: Record<AiSpecialtyGroup, keyof typeof AGENT_REGISTRY> = {
    [AiSpecialtyGroup.MEDICINA_GERAL]: 'general-practitioner',
    [AiSpecialtyGroup.MEDICINA_ESPECIALIZADA]: 'general-practitioner',
    [AiSpecialtyGroup.SAUDE_MENTAL]: 'psychologist',
    [AiSpecialtyGroup.REABILITACAO]: 'physiotherapist',
    [AiSpecialtyGroup.NUTRICAO_DIETETICA]: 'nutritionist',
    [AiSpecialtyGroup.ENFERMAGEM]: 'nurse',
    [AiSpecialtyGroup.OUTROS]: 'general-practitioner',
};
