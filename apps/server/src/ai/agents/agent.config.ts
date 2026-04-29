import * as fs from "fs";
import * as path from "path";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { DocumentEntityType } from "@domain/document-permission/entities";

export type AgentConfig = {
  slug: string;
  name: string;
  /** Formato OpenRouter: provider/model-name */
  providerModelId: string;
  baseInstructions: string;
  guardrails: string;
  analysisGoals: string[];
  contextPriority: Record<string, number>;
  allowedSources: DocumentEntityType[];
  maxTokens: number;
  temperature: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requirePromptFile(name: string): string {
  const filePath = path.resolve(process.cwd(), `src/ai/agents/prompts/${name}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required prompt file: src/ai/agents/prompts/${name}.md`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Lê analysisGoals de uma variável de ambiente no formato CSV.
 * Ex: AGENT_GP_ANALYSIS_GOALS="resumo clínico,hipóteses diagnósticas,inconsistências"
 */
function requireGoals(envVar: string): string[] {
  const value = requireEnv(envVar);
  const goals = value
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  if (goals.length === 0) {
    throw new Error(`Environment variable ${envVar} must contain at least one goal`);
  }

  return goals;
}

/**
 * Lê contextPriority de uma variável de ambiente no formato "key:num,key:num".
 * Ex: AGENT_GP_CONTEXT_PRIORITY="records:1,alerts:2,profile:3,forms:4"
 */
function requirePriority(envVar: string): Record<string, number> {
  const value = requireEnv(envVar);
  const entries = value
    .split(",")
    .map((pair) => pair.trim().split(":"))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([key, val]) => [key.trim(), parseInt(val.trim(), 10)] as const);

  if (entries.length === 0) {
    throw new Error(
      `Environment variable ${envVar} must be in format "key:num,key:num" (e.g. "records:1,alerts:2")`,
    );
  }

  return Object.fromEntries(entries);
}

// ---------------------------------------------------------------------------
// Prompts carregados e validados na inicialização
// ---------------------------------------------------------------------------

const PROMPTS = {
  guardrails: requirePromptFile("guardrails/default"),
  generalPractitioner: requirePromptFile("general-practitioner"),
  psychologist: requirePromptFile("psychologist"),
  physiotherapist: requirePromptFile("physiotherapist"),
  speechTherapist: requirePromptFile("speech-therapist"),
  nutritionist: requirePromptFile("nutritionist"),
  occupationalTherapist: requirePromptFile("occupational-therapist"),
  nurse: requirePromptFile("nurse"),
};

const DEFAULT_ALLOWED_SOURCES: DocumentEntityType[] = [
  DocumentEntityType.RECORD,
  DocumentEntityType.PATIENT_FORM,
  DocumentEntityType.CLINICAL_PROFILE,
  DocumentEntityType.PATIENT_ALERT,
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Registry central de agentes clínicos.
 *
 * Todas as variáveis abaixo são obrigatórias — a ausência de qualquer uma
 * lança erro na inicialização antes de o servidor aceitar requisições.
 *
 * Variáveis por agente (prefixo indicado abaixo):
 *   AGENT_<PREFIX>_MODEL            string  — modelo OpenRouter (ex: anthropic/claude-sonnet-4)
 *   AGENT_<PREFIX>_MAX_TOKENS       number  — ex: 1500
 *   AGENT_<PREFIX>_TEMPERATURE      float   — ex: 0.3
 *   AGENT_<PREFIX>_ANALYSIS_GOALS   CSV     — ex: "resumo clínico,hipóteses diagnósticas"
 *   AGENT_<PREFIX>_CONTEXT_PRIORITY key:n   — ex: "records:1,alerts:2,profile:3,forms:4"
 */
export const AGENT_REGISTRY = {
  "general-practitioner": {
    slug: "general-practitioner",
    name: "Clínico Geral",
    providerModelId: requireEnv("AGENT_GP_MODEL"),
    baseInstructions: PROMPTS.generalPractitioner,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_GP_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_GP_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_GP_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_GP_TEMPERATURE")),
  },

  psychologist: {
    slug: "psychologist",
    name: "Psicologia",
    providerModelId: requireEnv("AGENT_PSY_MODEL"),
    baseInstructions: PROMPTS.psychologist,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_PSY_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_PSY_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_PSY_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_PSY_TEMPERATURE")),
  },

  physiotherapist: {
    slug: "physiotherapist",
    name: "Fisioterapia",
    providerModelId: requireEnv("AGENT_PHYSIO_MODEL"),
    baseInstructions: PROMPTS.physiotherapist,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_PHYSIO_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_PHYSIO_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_PHYSIO_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_PHYSIO_TEMPERATURE")),
  },

  "speech-therapist": {
    slug: "speech-therapist",
    name: "Fonoaudiologia",
    providerModelId: requireEnv("AGENT_SPEECH_MODEL"),
    baseInstructions: PROMPTS.speechTherapist,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_SPEECH_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_SPEECH_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_SPEECH_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_SPEECH_TEMPERATURE")),
  },

  nutritionist: {
    slug: "nutritionist",
    name: "Nutrição",
    providerModelId: requireEnv("AGENT_NUTRI_MODEL"),
    baseInstructions: PROMPTS.nutritionist,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_NUTRI_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_NUTRI_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_NUTRI_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_NUTRI_TEMPERATURE")),
  },

  "occupational-therapist": {
    slug: "occupational-therapist",
    name: "Terapia Ocupacional",
    providerModelId: requireEnv("AGENT_OT_MODEL"),
    baseInstructions: PROMPTS.occupationalTherapist,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_OT_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_OT_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_OT_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_OT_TEMPERATURE")),
  },

  nurse: {
    slug: "nurse",
    name: "Enfermagem",
    providerModelId: requireEnv("AGENT_NURSE_MODEL"),
    baseInstructions: PROMPTS.nurse,
    guardrails: PROMPTS.guardrails,
    analysisGoals: requireGoals("AGENT_NURSE_ANALYSIS_GOALS"),
    contextPriority: requirePriority("AGENT_NURSE_CONTEXT_PRIORITY"),
    allowedSources: DEFAULT_ALLOWED_SOURCES,
    maxTokens: parseInt(requireEnv("AGENT_NURSE_MAX_TOKENS"), 10),
    temperature: parseFloat(requireEnv("AGENT_NURSE_TEMPERATURE")),
  },
} as const satisfies Record<string, AgentConfig>;

/**
 * Mapeamento estático de especialidade clínica → slug de agente.
 */
export const SPECIALTY_AGENT_MAP: Record<AiSpecialtyGroup, keyof typeof AGENT_REGISTRY> = {
  [AiSpecialtyGroup.MEDICINA_GERAL]: "general-practitioner",
  [AiSpecialtyGroup.MEDICINA_ESPECIALIZADA]: "general-practitioner",
  [AiSpecialtyGroup.SAUDE_MENTAL]: "psychologist",
  [AiSpecialtyGroup.REABILITACAO]: "physiotherapist",
  [AiSpecialtyGroup.NUTRICAO_DIETETICA]: "nutritionist",
  [AiSpecialtyGroup.ENFERMAGEM]: "nurse",
  [AiSpecialtyGroup.OUTROS]: "general-practitioner",
};
