import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Room} from '../../../domain/room/entities';
import {RoomState} from '../../../domain/room/models/room-state';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Room'})
export class RoomDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The category ID of the room',
        format: 'uuid',
    })
    categoryId: string;

    @ApiProperty({
        description: 'The number of the room',
        example: 1,
    })
    number: number;

    @ApiProperty({
        description: 'The name of the room',
        example: 'Premium',
    })
    name: string | null;

    @ApiProperty({
        description: 'The state of the room',
        example: RoomState.VACANT,
        enum: RoomState,
        enumName: 'RoomState',
    })
    state: RoomState;

    constructor(room: Room) {
        super(room);
        this.companyId = room.companyId.toString();
        this.categoryId = room.categoryId.toString();
        this.number = room.number;
        this.name = room.name;
        this.state = room.state;
    }
}
