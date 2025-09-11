import {ApiProperty} from '@nestjs/swagger';
import type {AllEntityProps} from '../../../domain/@shared/entity';
import {RoomStatus} from '../../../domain/room-status/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class RoomStatusDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The unique identifier of the room',
        format: 'uuid',
    })
    roomId: string;

    @ApiProperty({
        description: 'The user who started the room status',
        format: 'uuid',
    })
    startedById: string;

    @ApiProperty({
        description: 'The date and time the room status started',
        format: 'date-time',
    })
    startedAt: string;

    @ApiProperty({
        description: 'The user who finish the room status',
        format: 'uuid',
    })
    finishedById: string | null;

    @ApiProperty({
        description: 'The date and time the room status finished',
        format: 'date-time',
    })
    finishedAt: string | null;

    constructor(roomStatus: AllEntityProps<RoomStatus>) {
        super(roomStatus);
        this.roomId = roomStatus.roomId.toString();
        this.startedById = roomStatus.startedById.toString();
        this.startedAt = roomStatus.startedAt.toISOString();
        this.finishedById = roomStatus.finishedById?.toString() ?? null;
        this.finishedAt = roomStatus.finishedAt?.toISOString() ?? null;
    }
}
