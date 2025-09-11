import {Body, Controller, Get, Patch, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {InspectionPermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    InspectionDto,
    getInspectionSchema,
    getInspectionByRoomSchema,
    ListInspectionDto,
    approveInspectionDtoSchema,
    ApproveInspectionInputDto,
    rejectInspectionDtoSchema,
    RejectInspectionInputDto,
} from '../dtos';
import {
    GetInspectionService,
    GetInspectionByRoomService,
    ListInspectionService,
    ApproveInspectionService,
    RejectInspectionService,
} from '../services';

@ApiTags('Inspection')
@Controller('inspection')
export class InspectionController {
    constructor(
        private readonly getInspectionService: GetInspectionService,
        private readonly getInspectionByRoomService: GetInspectionByRoomService,
        private readonly listInspectionService: ListInspectionService,
        private readonly approveInspectionService: ApproveInspectionService,
        private readonly rejectInspectionService: RejectInspectionService
    ) {}

    @ApiOperation({
        summary: 'Gets an inspection',
        parameters: [entityIdParam('Inspection ID')],
        responses: [
            {
                status: 200,
                description: 'Inspection found',
                type: InspectionDto,
            },
        ],
    })
    @Authorize(InspectionPermission.VIEW)
    @Get(':id')
    async getInspection(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getInspectionSchema.shape.id) id: RoomStatusId
    ): Promise<InspectionDto> {
        return this.getInspectionService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets an inspection by room ID',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Inspection found',
                type: InspectionDto,
            },
        ],
    })
    @Authorize(InspectionPermission.VIEW)
    @Get('room/:id')
    async getInspectionByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getInspectionByRoomSchema.shape.id) id: RoomId
    ): Promise<InspectionDto> {
        return this.getInspectionByRoomService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists inspections',
        responses: [
            {
                status: 200,
                description: 'Inspections found',
                type: [InspectionDto],
            },
        ],
    })
    @Authorize(InspectionPermission.VIEW)
    @Get()
    async listInspection(
        @RequestActor() actor: Actor,
        @Query() payload: ListInspectionDto
    ): Promise<PaginatedDto<InspectionDto>> {
        return this.listInspectionService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Approves an inspection',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Inspection approved',
                type: InspectionDto,
            },
        ],
    })
    @Authorize(InspectionPermission.APPROVE)
    @Patch('room/:roomId/approve')
    async approveInspection(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', approveInspectionDtoSchema.shape.roomId) roomId: RoomId,
        @Body() payload: ApproveInspectionInputDto
    ): Promise<InspectionDto> {
        return this.approveInspectionService.execute({actor, payload: {roomId, ...payload}});
    }

    @ApiOperation({
        summary: 'Rejects an inspection',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Inspection rejected',
                type: InspectionDto,
            },
        ],
    })
    @Authorize(InspectionPermission.REJECT)
    @Patch('room/:roomId/reject')
    async rejectInspection(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', rejectInspectionDtoSchema.shape.roomId) roomId: RoomId,
        @Body() payload: RejectInspectionInputDto
    ): Promise<InspectionDto> {
        return this.rejectInspectionService.execute({actor, payload: {roomId, ...payload}});
    }
}
