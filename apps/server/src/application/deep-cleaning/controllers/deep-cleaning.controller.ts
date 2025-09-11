import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {DeepCleaningPermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    StartDeepCleaningDto,
    DeepCleaningDto,
    FinishDeepCleaningInputDto,
    finishDeepCleaningSchema,
    getDeepCleaningSchema,
    ListDeepCleaningDto,
} from '../dtos';
import {getDeepCleaningByRoomSchema} from '../dtos/get-deep-cleaning-by-room.dto';
import {
    StartDeepCleaningService,
    FinishDeepCleaningService,
    GetDeepCleaningByRoomService,
    GetDeepCleaningService,
    ListDeepCleaningService,
} from '../services';

@ApiTags('Deep cleaning')
@Controller('deep-cleaning')
export class DeepCleaningController {
    constructor(
        private readonly startDeepCleaningService: StartDeepCleaningService,
        private readonly listDeepCleaningService: ListDeepCleaningService,
        private readonly getDeepCleaningService: GetDeepCleaningService,
        private readonly getDeepCleaningByRoomService: GetDeepCleaningByRoomService,
        private readonly finishDeepCleaningService: FinishDeepCleaningService
    ) {}

    @ApiOperation({
        summary: 'Starts a new deep cleaning',
        responses: [
            {
                status: 201,
                description: 'Deep cleaning started',
                type: DeepCleaningDto,
            },
        ],
    })
    @Authorize(DeepCleaningPermission.START)
    @Post()
    async startDeepCleaning(
        @RequestActor() actor: Actor,
        @Body() payload: StartDeepCleaningDto
    ): Promise<DeepCleaningDto> {
        return this.startDeepCleaningService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds deep cleanings',
        responses: [
            {
                status: 200,
                description: 'Deep cleanings found',
                model: DeepCleaningDto,
            },
        ],
    })
    @Authorize(DeepCleaningPermission.VIEW)
    @Get()
    async listDeepCleaning(
        @RequestActor() actor: Actor,
        @Query() payload: ListDeepCleaningDto
    ): Promise<PaginatedDto<DeepCleaningDto>> {
        return this.listDeepCleaningService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a deep cleaning',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Deep cleaning found',
                type: DeepCleaningDto,
            },
        ],
    })
    @Authorize(DeepCleaningPermission.VIEW)
    @Get(':id')
    async getDeepCleaning(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDeepCleaningSchema.shape.id) id: RoomStatusId
    ): Promise<DeepCleaningDto> {
        return this.getDeepCleaningService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets a deep cleaning by room',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Deep cleaning found',
                type: DeepCleaningDto,
            },
        ],
    })
    @Authorize(DeepCleaningPermission.VIEW)
    @Get('room/:roomId')
    async getDeepCleaningByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', getDeepCleaningByRoomSchema.shape.roomId) roomId: RoomId
    ): Promise<DeepCleaningDto> {
        return this.getDeepCleaningByRoomService.execute({actor, payload: {roomId}});
    }

    @ApiOperation({
        summary: 'Finish a deep cleaning',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Deep cleaning finished',
            },
        ],
    })
    @Authorize(DeepCleaningPermission.FINISH)
    @Patch('room/:roomId/finish')
    async finishDeepCleaning(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', finishDeepCleaningSchema.shape.roomId) roomId: RoomId,
        @Body() payload: FinishDeepCleaningInputDto
    ): Promise<DeepCleaningDto> {
        return this.finishDeepCleaningService.execute({actor, payload: {roomId, ...payload}});
    }
}
