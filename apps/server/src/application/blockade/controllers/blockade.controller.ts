import {Body, Controller, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {BlockadePermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    BlockadeDto,
    finishBlockadeSchema,
    getBlockadeByRoomSchema,
    getBlockadeSchema,
    ListBlockadeDto,
    StartBlockadeDto,
    UpdateBlockadeInputDto,
    updateBlockadeSchema,
} from '../dtos';
import {
    FinishBlockadeService,
    GetBlockadeByRoomService,
    GetBlockadeService,
    ListBlockadeService,
    StartBlockadeService,
    UpdateBlockadeService,
} from '../services';

@ApiTags('Blockade')
@Controller('blockade')
export class BlockadeController {
    constructor(
        private readonly startBlockadeService: StartBlockadeService,
        private readonly updateBlockadeService: UpdateBlockadeService,
        private readonly listBlockadeService: ListBlockadeService,
        private readonly getBlockadeService: GetBlockadeService,
        private readonly getBlockadeByRoomService: GetBlockadeByRoomService,
        private readonly finishBlockadeService: FinishBlockadeService
    ) {}

    @ApiOperation({
        summary: 'Starts a new blockade',
        responses: [
            {
                status: 201,
                description: 'Blockade started',
                type: BlockadeDto,
            },
        ],
    })
    @Authorize(BlockadePermission.START)
    @Post()
    async startBlockade(@RequestActor() actor: Actor, @Body() payload: StartBlockadeDto): Promise<BlockadeDto> {
        return this.startBlockadeService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds blockades',
        responses: [
            {
                status: 200,
                description: 'Blockades found',
                model: BlockadeDto,
            },
        ],
    })
    @Authorize(BlockadePermission.VIEW)
    @Get()
    async listBlockade(
        @RequestActor() actor: Actor,
        @Query() payload: ListBlockadeDto
    ): Promise<PaginatedDto<BlockadeDto>> {
        return this.listBlockadeService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a blockade',
        parameters: [entityIdParam('Blockade ID')],
        responses: [
            {
                status: 200,
                description: 'Blockade found',
                type: BlockadeDto,
            },
        ],
    })
    @Authorize(BlockadePermission.VIEW)
    @Get(':id')
    async getBlockade(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getBlockadeSchema.shape.id) id: RoomStatusId
    ): Promise<BlockadeDto> {
        return this.getBlockadeService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets a blockade by room ID',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'blockade found',
                type: BlockadeDto,
            },
        ],
    })
    @Authorize(BlockadePermission.VIEW)
    @Get('room/:roomId')
    async getBlockadeByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', getBlockadeByRoomSchema.shape.roomId) roomId: RoomId
    ): Promise<BlockadeDto> {
        return this.getBlockadeByRoomService.execute({actor, payload: {roomId}});
    }

    @ApiOperation({
        summary: 'Updates a blockade',
        parameters: [entityIdParam('Blockade ID')],
        responses: [
            {
                status: 200,
                description: 'Blockade updated',
                type: BlockadeDto,
            },
        ],
    })
    @Authorize(BlockadePermission.UPDATE)
    @Put(':id')
    async updateBlockade(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateBlockadeSchema.shape.id) id: RoomStatusId,
        @Body() payload: UpdateBlockadeInputDto
    ): Promise<BlockadeDto> {
        return this.updateBlockadeService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Finish a blockade',
        parameters: [entityIdParam('Blockade ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Blockade finished',
            },
        ],
    })
    @Authorize(BlockadePermission.FINISH)
    @Patch('room/:roomId/finish')
    async finishBlockade(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', finishBlockadeSchema.shape.roomId) roomId: RoomId
    ): Promise<BlockadeDto> {
        return this.finishBlockadeService.execute({actor, payload: {roomId}});
    }
}
