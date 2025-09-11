import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {AuditPermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    AuditDto,
    finishAuditDtoSchema,
    FinishAuditInputDto,
    getAuditByRoomSchema,
    getAuditSchema,
    ListAuditDto,
    StartAuditDto,
} from '../dtos';
import {
    FinishAuditService,
    GetAuditService,
    GetAuditByRoomService,
    ListAuditService,
    StartAuditService,
} from '../services';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
    constructor(
        private readonly startAuditService: StartAuditService,
        private readonly finishAuditService: FinishAuditService,
        private readonly getAuditService: GetAuditService,
        private readonly getAuditByRoomService: GetAuditByRoomService,
        private readonly listAuditService: ListAuditService
    ) {}

    @ApiOperation({
        summary: 'Starts a new audit',
        responses: [
            {
                status: 201,
                description: 'Audit started',
                type: AuditDto,
            },
        ],
    })
    @Authorize(AuditPermission.START)
    @Post()
    async startAudit(@RequestActor() actor: Actor, @Body() payload: StartAuditDto): Promise<AuditDto> {
        return this.startAuditService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Finishes an audit',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 204,
                description: 'Audit finished',
                type: AuditDto,
            },
        ],
    })
    @Authorize(AuditPermission.FINISH)
    @Patch('room/:roomId/finish')
    async finishAudit(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', finishAuditDtoSchema.shape.roomId) roomId: RoomId,
        @Body() payload: FinishAuditInputDto
    ): Promise<AuditDto> {
        return this.finishAuditService.execute({actor, payload: {roomId, ...payload}});
    }

    @ApiOperation({
        summary: 'Gets an audit',
        parameters: [entityIdParam('Audit ID')],
        responses: [
            {
                status: 200,
                description: 'Audit found',
                type: AuditDto,
            },
        ],
    })
    @Authorize(AuditPermission.VIEW)
    @Get(':id')
    async getAudit(@RequestActor() actor: Actor, @ValidatedParam('id', getAuditSchema.shape.id) id: RoomStatusId) {
        return this.getAuditService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets an audit by room ID',
        parameters: [entityIdParam('Room ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Audit found',
                type: AuditDto,
            },
        ],
    })
    @Authorize(AuditPermission.VIEW)
    @Get('room/:roomId')
    async getAuditByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', getAuditByRoomSchema.shape.roomId) roomId: RoomId
    ): Promise<AuditDto> {
        return this.getAuditByRoomService.execute({actor, payload: {roomId}});
    }

    @ApiOperation({
        summary: 'Finds audits',
        responses: [
            {
                status: 200,
                description: 'Audits found',
                type: AuditDto,
            },
        ],
    })
    @Authorize(AuditPermission.VIEW)
    @Get()
    async listAudit(@RequestActor() actor: Actor, @Query() payload: ListAuditDto): Promise<PaginatedDto<AuditDto>> {
        return this.listAuditService.execute({actor, payload});
    }
}
