import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {Specialty} from '../../form-template/entities';

export type AiAgentProfileProps = EntityProps<AiAgentProfile>;
export type CreateAiAgentProfile = CreateEntity<AiAgentProfile>;
export type UpdateAiAgentProfile = Partial<AiAgentProfileProps>;

export class AiAgentProfile extends AggregateRoot<AiAgentProfileId> {
    name: string;
    /** Identificador único legível, ex: "psicologia-adulto" */
    slug: string;
    /** null = agente genérico; preenchido = agente especialista por Specialty */
    specialty: Specialty | null;
    description: string | null;
    /** Instruções base que serão passadas como system prompt ao LLM (próxima etapa). */
    baseInstructions: string | null;
    /** Tipos de fonte que este agente pode usar, ex: ["RECORD", "CLINICAL_PROFILE"] */
    allowedSources: string[];
    /** Configuração livre de prioridades de contexto para montagem do prompt. */
    contextPriority: Record<string, unknown> | null;
    isActive: boolean;

    constructor(props: AllEntityProps<AiAgentProfile>) {
        super(props);
        this.name = props.name;
        this.slug = props.slug;
        this.specialty = props.specialty ?? null;
        this.description = props.description ?? null;
        this.baseInstructions = props.baseInstructions ?? null;
        this.allowedSources = props.allowedSources ?? [];
        this.contextPriority = props.contextPriority ?? null;
        this.isActive = props.isActive ?? true;
    }

    static create(props: CreateAiAgentProfile): AiAgentProfile {
        const now = new Date();

        return new AiAgentProfile({
            ...props,
            id: AiAgentProfileId.generate(),
            name: props.name!,
            slug: props.slug!,
            specialty: props.specialty ?? null,
            description: props.description ?? null,
            baseInstructions: props.baseInstructions ?? null,
            allowedSources: props.allowedSources ?? [],
            contextPriority: props.contextPriority ?? null,
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
            slug: this.slug,
            specialty: this.specialty,
            description: this.description,
            baseInstructions: this.baseInstructions,
            allowedSources: this.allowedSources,
            contextPriority: this.contextPriority,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

export class AiAgentProfileId extends EntityId<'AiAgentProfileId'> {
    static from(value: string): AiAgentProfileId {
        return new AiAgentProfileId(value);
    }

    static generate(): AiAgentProfileId {
        return new AiAgentProfileId();
    }
}
