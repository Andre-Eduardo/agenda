import {
  AggregateRoot,
  type AllEntityProps,
  type EntityJson,
  type EntityProps,
  type CreateEntity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { AiSpecialtyGroup } from "@domain/form-template/entities";

export type AiAgentProfileProps = EntityProps<AiAgentProfile>;
export type CreateAiAgentProfile = CreateEntity<AiAgentProfile>;
export type UpdateAiAgentProfile = Partial<AiAgentProfileProps>;

export class AiAgentProfile extends AggregateRoot<AiAgentProfileId> {
  name: string;
  /** Identificador programático em snake_case, ex: "medico_geral", "psicologia_clinica" */
  code: string | null;
  /** Identificador único legível, ex: "psicologia-adulto" */
  slug: string;
  /** Grupo de especialidade para roteamento de IA. Substituiu o campo specialty: Specialty. */
  specialtyGroup: AiSpecialtyGroup | null;
  description: string | null;
  /** Instruções base que serão passadas como system prompt ao LLM. */
  baseInstructions: string | null;
  /** Tipos de fonte que este agente pode usar, ex: ["RECORD", "CLINICAL_PROFILE"] */
  allowedSources: string[];
  /** Configuração livre de prioridades de contexto para montagem do prompt. */
  contextPriority: Record<string, unknown> | null;
  /** Campos específicos de JSONB clínico que têm maior peso na análise. */
  priorityFields: Record<string, unknown> | null;
  /** Objetivos de análise do agente, ex: ["summary", "hypotheses", "next_steps"] */
  analysisGoals: string[];
  /**
   * Campos de PatientFacts bloqueados para este agente.
   * Esses campos são removidos antes de montar o contexto enviado ao LLM.
   */
  blacklistedFields: string[];
  /** Restrições comportamentais do agente (guardrails de segurança clínica). */
  guardrails: string | null;
  /** Estilo de resposta preferido (formato, tom, estrutura). */
  responseStyle: string | null;
  /**
   * Modelo fixo a ser usado por este agente no OpenRouter (ex: "openai/o1-mini").
   * Quando null, o sistema aplica o padrão da especialidade.
   */
  providerModelId: string | null;
  isActive: boolean;

  constructor(props: AllEntityProps<AiAgentProfile>) {
    super(props);
    this.name = props.name;
    this.code = props.code ?? null;
    this.slug = props.slug;
    this.specialtyGroup = props.specialtyGroup ?? null;
    this.description = props.description ?? null;
    this.baseInstructions = props.baseInstructions ?? null;
    this.allowedSources = props.allowedSources ?? [];
    this.contextPriority = props.contextPriority ?? null;
    this.priorityFields = props.priorityFields ?? null;
    this.analysisGoals = props.analysisGoals ?? [];
    this.blacklistedFields = props.blacklistedFields ?? [];
    this.guardrails = props.guardrails ?? null;
    this.responseStyle = props.responseStyle ?? null;
    this.providerModelId = props.providerModelId ?? null;
    this.isActive = props.isActive ?? true;
  }

  static create(props: CreateAiAgentProfile): AiAgentProfile {
    const now = new Date();

    return new AiAgentProfile({
      ...props,
      id: AiAgentProfileId.generate(),
      name: props.name,
      code: props.code ?? null,
      slug: props.slug,
      specialtyGroup: props.specialtyGroup ?? null,
      description: props.description ?? null,
      baseInstructions: props.baseInstructions ?? null,
      allowedSources: props.allowedSources ?? [],
      contextPriority: props.contextPriority ?? null,
      priorityFields: props.priorityFields ?? null,
      analysisGoals: props.analysisGoals ?? [],
      blacklistedFields: props.blacklistedFields ?? [],
      guardrails: props.guardrails ?? null,
      responseStyle: props.responseStyle ?? null,
      providerModelId: props.providerModelId ?? null,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  deactivate(): void {
    this.isActive = false;
    this.update();
  }

  activate(): void {
    this.isActive = true;
    this.update();
  }

  toJSON(): EntityJson<AiAgentProfile> {
    return {
      id: this.id.toJSON(),
      name: this.name,
      code: this.code,
      slug: this.slug,
      specialtyGroup: this.specialtyGroup,
      description: this.description,
      baseInstructions: this.baseInstructions,
      allowedSources: this.allowedSources,
      contextPriority: this.contextPriority,
      priorityFields: this.priorityFields,
      analysisGoals: this.analysisGoals,
      blacklistedFields: this.blacklistedFields,
      guardrails: this.guardrails,
      responseStyle: this.responseStyle,
      providerModelId: this.providerModelId,
      isActive: this.isActive,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: null,
    };
  }
}

export class AiAgentProfileId extends EntityId<"AiAgentProfileId"> {
  static from(value: string): AiAgentProfileId {
    return new AiAgentProfileId(value);
  }

  static generate(): AiAgentProfileId {
    return new AiAgentProfileId();
  }
}
