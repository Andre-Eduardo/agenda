import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {Room} from '@domain/room/entities';

@ApiSchema({name: 'Room'})
export class RoomDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'Clinic this room belongs to'})
    clinicId: string;

    @ApiProperty({description: 'Room name', example: 'Consultório 1'})
    name: string;

    @ApiProperty({description: 'Whether this room is available for scheduling'})
    active: boolean;

    constructor(room: Room) {
        super(room);
        this.clinicId = room.clinicId.toString();
        this.name = room.name;
        this.active = room.active;
    }
}
