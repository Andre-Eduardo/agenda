import {ApiProperty} from '@nestjs/swagger';
import type {EntityId} from '../../../domain/@shared/entity/id';

export type EntityDtoProps = {
    id: EntityId<string>;
    createdAt: Date;
    updatedAt: Date;
};

export abstract class EntityDto {
    @ApiProperty({
        format: 'uuid',
        description: 'The unique identifier of the entity',
    })
    id: string;

    @ApiProperty({
        format: 'date-time',
        description: 'The date and time the entity was created',
    })
    createdAt: string;

    @ApiProperty({
        format: 'date-time',
        description: 'The date and time the entity was last updated',
    })
    updatedAt: string;

    protected constructor(entity: EntityDtoProps) {
        this.id = entity.id.toString();
        this.createdAt = entity.createdAt.toISOString();
        this.updatedAt = entity.updatedAt.toISOString();
    }
}
