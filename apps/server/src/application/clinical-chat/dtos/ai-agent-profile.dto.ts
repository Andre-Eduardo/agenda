import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {EntityDto} from '../../@shared/dto';
import {Specialty} from '../../../domain/form-template/entities';
import type {AiAgentProfile} from '../../../domain/clinical-chat/entities';
import {createZodDto} from '../../@shared/validation/dto';

@ApiSchema({name: 'AiAgentProfile'})
export class AiAgentProfileDto extends EntityDto {
    @ApiProperty()
    name: string;

    @ApiProperty({nullable: true, description: 'Identificador programático em snake_case, ex: "medico_geral"'})
    code: string | null;

    @ApiProperty({description: 'Identificador único legível, ex: "psicologia-adulto"'})
    slug: string;

    @ApiProperty({nullable: true, description: 'Grupo de especialidade, ex: "medicina", "psicologia"'})
    specialtyGroup: string | null;

    @ApiProperty({enum: Specialty, nullable: true})
    specialty: Specialty | null;

    @ApiProperty({nullable: true})
    description: string | null;

    @ApiProperty({nullable: true, description: 'Instruções base para o LLM (system prompt)'})
    baseInstructions: string | null;

    @ApiProperty({type: String, isArray: true, description: 'Fontes de contexto permitidas para este agente'})
    allowedSources: string[];

    @ApiProperty({nullable: true, description: 'Pesos de prioridade por tipo de contexto'})
    contextPriority: Record<string, unknown> | null;

    @ApiProperty({nullable: true, description: 'Campos de JSONB clínico com maior peso na análise'})
    priorityFields: Record<string, unknown> | null;

    @ApiProperty({type: String, isArray: true, description: 'Objetivos de análise, ex: ["summary", "hypotheses", "next_steps"]'})
    analysisGoals: string[];

    @ApiProperty({
        type: String,
        isArray: true,
        description:
            'Campos de PatientFacts bloqueados para este agente. ' +
            'Removidos antes de montar o prompt enviado ao LLM. Ex: ["documentId"].',
    })
    blacklistedFields: string[];

    @ApiProperty({nullable: true, description: 'Restrições comportamentais (guardrails de segurança clínica)'})
    guardrails: string | null;

    @ApiProperty({nullable: true, description: 'Estilo de resposta preferido (formato, tom, estrutura)'})
    responseStyle: string | null;

    @ApiProperty({
        nullable: true,
        description:
            'Modelo fixo para este agente no OpenRouter (ex: "openai/o1-mini"). ' +
            'Quando null, usa o padrão da especialidade. O valor "openrouter/auto" não é permitido.',
    })
    providerModelId: string | null;

    @ApiProperty()
    isActive: boolean;

    constructor(entity: AiAgentProfile) {
        super(entity);
        this.name = entity.name;
        this.code = entity.code;
        this.slug = entity.slug;
        this.specialtyGroup = entity.specialtyGroup;
        this.specialty = entity.specialty;
        this.description = entity.description;
        this.baseInstructions = entity.baseInstructions;
        this.allowedSources = entity.allowedSources;
        this.contextPriority = entity.contextPriority;
        this.priorityFields = entity.priorityFields;
        this.analysisGoals = entity.analysisGoals;
        this.blacklistedFields = entity.blacklistedFields;
        this.guardrails = entity.guardrails;
        this.responseStyle = entity.responseStyle;
        this.providerModelId = entity.providerModelId;
        this.isActive = entity.isActive;
    }
}

export const createAiAgentProfileSchema = z.object({
    name: z.string().min(1).max(100),
    code: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9_]+$/, 'Code must be lowercase, alphanumeric with underscores')
        .optional(),
    slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric with hyphens'),
    specialtyGroup: z.string().min(1).max(50).optional(),
    specialty: z.nativeEnum(Specialty).optional(),
    description: z.string().optional(),
    baseInstructions: z.string().optional(),
    allowedSources: z.array(z.string()).default([]),
    contextPriority: z.record(z.unknown()).optional(),
    priorityFields: z.record(z.unknown()).optional(),
    analysisGoals: z.array(z.string()).default([]),
    blacklistedFields: z.array(z.string()).default([]),
    guardrails: z.string().optional(),
    responseStyle: z.string().optional(),
    providerModelId: z
        .string()
        .refine((v) => v !== 'openrouter/auto', {
            message: 'O modelo "openrouter/auto" não é permitido. Especifique um modelo fixo.',
        })
        .optional(),
    isActive: z.boolean().default(true),
});

export class CreateAiAgentProfileDto extends createZodDto(createAiAgentProfileSchema) {}
