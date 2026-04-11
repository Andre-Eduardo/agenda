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

    @ApiProperty({description: 'Identificador único legível, ex: "psicologia-adulto"'})
    slug: string;

    @ApiProperty({enum: Specialty, nullable: true})
    specialty: Specialty | null;

    @ApiProperty({nullable: true})
    description: string | null;

    @ApiProperty({nullable: true, description: 'Instruções base para o LLM (system prompt)'})
    baseInstructions: string | null;

    @ApiProperty({isArray: true, description: 'Fontes de contexto permitidas para este agente'})
    allowedSources: string[];

    @ApiProperty({nullable: true})
    contextPriority: Record<string, unknown> | null;

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
        this.slug = entity.slug;
        this.specialty = entity.specialty;
        this.description = entity.description;
        this.baseInstructions = entity.baseInstructions;
        this.allowedSources = entity.allowedSources;
        this.contextPriority = entity.contextPriority;
        this.providerModelId = entity.providerModelId;
        this.isActive = entity.isActive;
    }
}

export const createAiAgentProfileSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric with hyphens'),
    specialty: z.nativeEnum(Specialty).optional(),
    description: z.string().optional(),
    baseInstructions: z.string().optional(),
    allowedSources: z.array(z.string()).default([]),
    contextPriority: z.record(z.unknown()).optional(),
    providerModelId: z
        .string()
        .refine((v) => v !== 'openrouter/auto', {
            message: 'O modelo "openrouter/auto" não é permitido. Especifique um modelo fixo.',
        })
        .optional(),
    isActive: z.boolean().default(true),
});

export class CreateAiAgentProfileDto extends createZodDto(createAiAgentProfileSchema) {}
