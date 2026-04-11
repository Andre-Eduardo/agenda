import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {EntityDto} from '../../@shared/dto';
import {ChatSessionStatus} from '../../../domain/clinical-chat/entities';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AiAgentProfileId} from '../../../domain/clinical-chat/entities';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {createZodDto} from '../../@shared/validation/dto';
import type {PatientChatSession} from '../../../domain/clinical-chat/entities';

@ApiSchema({name: 'PatientChatSession'})
export class PatientChatSessionDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    professionalId: string;

    @ApiProperty({format: 'uuid', nullable: true})
    agentProfileId: string | null;

    @ApiProperty({nullable: true})
    title: string | null;

    @ApiProperty({enum: ChatSessionStatus})
    status: ChatSessionStatus;

    @ApiProperty({format: 'date-time'})
    lastActivityAt: string;

    @ApiProperty({format: 'date-time', nullable: true})
    deletedAt: string | null;

    constructor(entity: PatientChatSession) {
        super(entity);
        this.patientId = entity.patientId.toString();
        this.professionalId = entity.professionalId.toString();
        this.agentProfileId = entity.agentProfileId?.toString() ?? null;
        this.title = entity.title;
        this.status = entity.status;
        this.lastActivityAt = entity.lastActivityAt.toISOString();
        this.deletedAt = entity.deletedAt?.toISOString() ?? null;
    }
}

export const createChatSessionSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId),
    agentProfileId: entityId(AiAgentProfileId).optional(),
    title: z.string().max(255).optional(),
});

export class CreateChatSessionDto extends createZodDto(createChatSessionSchema) {}

export const listChatSessionsSchema = pagination(['createdAt', 'updatedAt', 'lastActivityAt'] as const).extend({
    patientId: entityId(PatientId).optional(),
    professionalId: entityId(ProfessionalId).optional(),
    status: z.nativeEnum(ChatSessionStatus).optional(),
});

export class ListChatSessionsDto extends createZodDto(listChatSessionsSchema) {}
