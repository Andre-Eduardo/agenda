import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {EntityDto} from '../../@shared/dto';
import {ChatMessageRole} from '../../../domain/clinical-chat/entities';
import {PatientChatSessionId} from '../../../domain/clinical-chat/entities';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {createZodDto} from '../../@shared/validation/dto';
import type {PatientChatMessage} from '../../../domain/clinical-chat/entities';

@ApiSchema({name: 'PatientChatMessage'})
export class PatientChatMessageDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    sessionId: string;

    @ApiProperty({enum: ChatMessageRole})
    role: ChatMessageRole;

    @ApiProperty()
    content: string;

    @ApiProperty({nullable: true})
    metadata: Record<string, unknown> | null;

    @ApiProperty({type: String, isArray: true, description: 'IDs dos chunks usados como contexto (rastreabilidade RAG)'})
    chunkIds: string[];

    constructor(entity: PatientChatMessage) {
        super(entity);
        this.sessionId = entity.sessionId.toString();
        this.role = entity.role;
        this.content = entity.content;
        this.metadata = entity.metadata;
        this.chunkIds = entity.chunkIds;
    }
}

export const addChatMessageSchema = z.object({
    role: z.nativeEnum(ChatMessageRole),
    content: z.string().min(1).max(10000),
    metadata: z.record(z.unknown()).optional(),
    chunkIds: z.array(z.string().uuid()).optional().default([]),
});

export class AddChatMessageDto extends createZodDto(addChatMessageSchema) {}

export const listChatMessagesSchema = pagination(['createdAt'] as const).extend({
    sessionId: entityId(PatientChatSessionId),
});

export class ListChatMessagesDto extends createZodDto(listChatMessagesSchema) {}
