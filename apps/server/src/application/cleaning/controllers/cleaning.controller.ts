import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {CleaningPermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    StartCleaningDto,
    FinishCleaningInputDto,
    finishCleaningSchema,
    getCleaningByRoomSchema,
    getCleaningSchema,
    ListCleaningDto,
} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';
import {
    StartCleaningService,
    ListCleaningService,
    GetCleaningService,
    FinishCleaningService,
    GetCleaningByRoomService,
} from '../services';

@ApiTags('Cleaning')
@Controller('cleaning')
export class CleaningController {
    constructor(
        private readonly startCleaningService: StartCleaningService,
        private readonly listCleaningService: ListCleaningService,
        private readonly getCleaningService: GetCleaningService,
        private readonly getCleaningByRoomService: GetCleaningByRoomService,
        private readonly finishCleaningService: FinishCleaningService
    ) {}

    @ApiOperation({
        summary: 'Starts a new cleaning',
        responses: [
            {
                status: 201,
                description: 'Cleaning started',
                type: CleaningDto,
            },
        ],
    })
    @Authorize(CleaningPermission.START)
    @Post()
    async startCleaning(@RequestActor() actor: Actor, @Body() payload: StartCleaningDto): Promise<CleaningDto> {
        return this.startCleaningService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds cleanings',
        responses: [
            {
                status: 200,
                description: 'Cleanings found',
                model: CleaningDto,
            },
        ],
    })
    @Authorize(CleaningPermission.VIEW)
    @Get()
    async listCleaning(
        @RequestActor() actor: Actor,
        @Query() payload: ListCleaningDto
    ): Promise<PaginatedDto<CleaningDto>> {
        return this.listCleaningService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a cleaning',
        parameters: [entityIdParam('Cleaning ID')],
        responses: [
            {
                status: 200,
                description: 'Cleaning found',
                type: CleaningDto,
            },
        ],
    })
    @Authorize(CleaningPermission.VIEW)
    @Get(':id')
    async getCleaning(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getCleaningSchema.shape.id) id: RoomStatusId
    ): Promise<CleaningDto> {
        return this.getCleaningService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets a cleaning by room',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Cleaning found',
                type: CleaningDto,
            },
        ],
    })
    @Authorize(CleaningPermission.VIEW)
    @Get('room/:roomId')
    async getCleaningByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', getCleaningByRoomSchema.shape.roomId) roomId: RoomId
    ): Promise<CleaningDto> {
        return this.getCleaningByRoomService.execute({actor, payload: {roomId}});
    }

    @ApiOperation({
        summary: 'Finish a cleaning',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Cleaning finished',
            },
        ],
    })
    @Authorize(CleaningPermission.FINISH)
    @Patch('room/:roomId/finish')
    async finishCleaning(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', finishCleaningSchema.shape.roomId) roomId: RoomId,
        @Body() payload: FinishCleaningInputDto
    ): Promise<CleaningDto> {
        return this.finishCleaningService.execute({actor, payload: {roomId, ...payload}});
    }
}
