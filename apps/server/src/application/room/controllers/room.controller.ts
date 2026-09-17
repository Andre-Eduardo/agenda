import {Body, Controller, Delete, Get, HttpCode, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {entityId} from '@application/@shared/validation/schemas';
import {CreateRoomDto, RoomDto, UpdateRoomInputDto} from '@application/room/dtos';
import {CreateRoomService, DeleteRoomService, ListRoomsService, UpdateRoomService} from '@application/room/services';
import {Actor} from '@domain/@shared/actor';
import {RoomPermission} from '@domain/auth';
import {RoomId} from '@domain/room/entities';

const roomIdSchema = entityId(RoomId);

@ApiTags('Room')
@Controller('rooms')
export class RoomController {
    constructor(
        private readonly createRoomService: CreateRoomService,
        private readonly listRoomsService: ListRoomsService,
        private readonly updateRoomService: UpdateRoomService,
        private readonly deleteRoomService: DeleteRoomService
    ) {}

    @ApiOperation({
        summary: 'Creates a room for the current clinic',
        responses: [{status: 201, description: 'Room created', type: RoomDto}],
    })
    @Authorize(RoomPermission.CREATE)
    @Post()
    createRoom(@RequestActor() actor: Actor, @Body() payload: CreateRoomDto): Promise<RoomDto> {
        return this.createRoomService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Lists rooms for the current clinic',
        responses: [{status: 200, description: 'List of rooms', type: [RoomDto]}],
    })
    @Authorize(RoomPermission.VIEW)
    @Get()
    listRooms(@RequestActor() actor: Actor): Promise<RoomDto[]> {
        return this.listRoomsService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Updates a room (name and/or active state)',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [{status: 200, description: 'Room updated', type: RoomDto}],
    })
    @Authorize(RoomPermission.UPDATE)
    @Patch(':roomId')
    updateRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', roomIdSchema) roomId: RoomId,
        @Body() payload: UpdateRoomInputDto
    ): Promise<RoomDto> {
        return this.updateRoomService.execute({actor, payload: {...payload, id: roomId}});
    }

    @ApiOperation({
        summary: 'Deletes a room',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [{status: 204, description: 'Room deleted'}],
    })
    @Authorize(RoomPermission.DELETE)
    @Delete(':roomId')
    @HttpCode(204)
    async deleteRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', roomIdSchema) roomId: RoomId
    ): Promise<void> {
        await this.deleteRoomService.execute({actor, payload: {id: roomId}});
    }
}
