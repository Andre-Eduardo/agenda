import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {RoomPermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    RoomDto,
    CreateRoomDto,
    deleteRoomSchema,
    getRoomSchema,
    ListRoomDto,
    UpdateRoomInputDto,
    updateRoomSchema,
} from '../dtos';
import {CreateRoomService, DeleteRoomService, GetRoomService, ListRoomService, UpdateRoomService} from '../services';

@ApiTags('Room')
@Controller('room')
export class RoomController {
    constructor(
        private readonly createRoomService: CreateRoomService,
        private readonly getRoomService: GetRoomService,
        private readonly listRoomService: ListRoomService,
        private readonly updateRoomService: UpdateRoomService,
        private readonly deleteRoomService: DeleteRoomService
    ) {}

    @ApiOperation({
        summary: 'Creates a new room',
        responses: [
            {
                status: 201,
                description: 'Room created',
                type: RoomDto,
            },
        ],
    })
    @Authorize(RoomPermission.CREATE)
    @Post()
    async createRoom(@RequestActor() actor: Actor, @Body() payload: CreateRoomDto): Promise<RoomDto> {
        return this.createRoomService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a room',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Room found',
                type: RoomDto,
            },
        ],
    })
    @Authorize(RoomPermission.VIEW)
    @Get(':id')
    async getRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getRoomSchema.shape.id) id: RoomId
    ): Promise<RoomDto> {
        return this.getRoomService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Lists rooms',
        responses: [
            {
                status: 200,
                description: 'Rooms found',
                model: RoomDto,
            },
        ],
    })
    @Authorize(RoomPermission.VIEW)
    @Get()
    async listRoom(@RequestActor() actor: Actor, @Query() payload: ListRoomDto): Promise<PaginatedDto<RoomDto>> {
        return this.listRoomService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a room',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Room updated',
                type: RoomDto,
            },
        ],
    })
    @Authorize(RoomPermission.UPDATE)
    @Put(':id')
    async updateRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateRoomSchema.shape.id) id: RoomId,
        @Body() payload: UpdateRoomInputDto
    ): Promise<RoomDto> {
        return this.updateRoomService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a room',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Room deleted',
            },
        ],
    })
    @Authorize(RoomPermission.DELETE)
    @Delete(':id')
    async deleteRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteRoomSchema.shape.id) id: RoomId
    ): Promise<void> {
        await this.deleteRoomService.execute({actor, payload: {id}});
    }
}
