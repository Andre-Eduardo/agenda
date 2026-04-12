import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {EntityDto} from '../../@shared/dto';
import {ChatSessionStatus} from '../../../domain/clinical-chat/entities';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {createZodDto} from '../../@shared/validation/dto';
import type {PatientChatSession, AiAgentProfile} from '../../../domain/clinical-chat/entities';

@ApiSchema({name: 'PatientChatSession'})
export class PatientChatSessionDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    professionalId: string;

    @ApiProperty({format: 'uuid', nullable: true})
    agentProfileId: string | null;

    /**
     * Nome do agente resolvido automaticamente com base na especialidade do profissional.
     * Exemplo: "Agente — Neurologia", "Agente — Psicologia Clínica".
     * Preenchido na criação da sessão; pode ser null em listagens históricas sem join.
     */
    @ApiProperty({
        nullable: true,
        description:
            'Nome do agente selecionado automaticamente com base no perfil profissional. ' +
            'Exibir na interface como "Agente ativo: {agentName}".',
    })
    agentName: string | null;

    /**
     * Slug do agente — identificador legível por humanos.
     * Exemplo: "neurologia", "psicologia-clinica".
     */
    @ApiProperty({nullable: true, description: 'Slug legível do agente ativo'})
    agentSlug: string | null;

    @ApiProperty({nullable: true})
    title: string | null;

    @ApiProperty({enum: ChatSessionStatus})
    status: ChatSessionStatus;

    @ApiProperty({format: 'date-time'})
    lastActivityAt: string;

    @ApiProperty({format: 'date-time', nullable: true})
    deletedAt: string | null;

    constructor(entity: PatientChatSession, resolvedAgent?: AiAgentProfile | null) {
        super(entity);
        this.patientId = entity.patientId.toString();
        this.professionalId = entity.professionalId.toString();
        this.agentProfileId = entity.agentProfileId?.toString() ?? null;
        this.agentName = resolvedAgent?.name ?? null;
        this.agentSlug = resolvedAgent?.slug ?? null;
        this.title = entity.title;
        this.status = entity.status;
        this.lastActivityAt = entity.lastActivityAt.toISOString();
        this.deletedAt = entity.deletedAt?.toISOString() ?? null;
    }
}

/**
 * Task 12 — agentProfileId removido da criação manual.
 * O agente é resolvido automaticamente pelo backend com base no perfil do profissional.
 */
export const createChatSessionSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId),
    title: z.string().max(255).optional(),
});

export class CreateChatSessionDto extends createZodDto(createChatSessionSchema) {}

export const listChatSessionsSchema = pagination(['createdAt', 'updatedAt', 'lastActivityAt'] as const).extend({
    patientId: entityId(PatientId).optional(),
    professionalId: entityId(ProfessionalId).optional(),
    status: z.nativeEnum(ChatSessionStatus).optional(),
});

export class ListChatSessionsDto extends createZodDto(listChatSessionsSchema) {}
