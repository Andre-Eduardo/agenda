import {Body, Controller, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {MaintenancePermission} from '../../../domain/auth';
import {RoomId} from '../../../domain/room/entities';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    finishMaintenanceSchema,
    getMaintenanceByRoomSchema,
    getMaintenanceSchema,
    ListMaintenanceDto,
    MaintenanceDto,
    StartMaintenanceDto,
    UpdateMaintenanceInputDto,
    updateMaintenanceSchema,
} from '../dtos';
import {
    FinishMaintenanceService,
    GetMaintenanceByRoomService,
    GetMaintenanceService,
    ListMaintenanceService,
    StartMaintenanceService,
    UpdateMaintenanceService,
} from '../services';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
    constructor(
        private readonly startMaintenanceService: StartMaintenanceService,
        private readonly updateMaintenanceService: UpdateMaintenanceService,
        private readonly listMaintenanceService: ListMaintenanceService,
        private readonly getMaintenanceService: GetMaintenanceService,
        private readonly getMaintenanceByRoomService: GetMaintenanceByRoomService,
        private readonly finishMaintenanceService: FinishMaintenanceService
    ) {}

    @ApiOperation({
        summary: 'Start a new maintenance',
        responses: [
            {
                status: 201,
                description: 'Maintenance started',
                type: MaintenanceDto,
            },
        ],
    })
    @Authorize(MaintenancePermission.START)
    @Post()
    async startMaintenance(
        @RequestActor() actor: Actor,
        @Body() payload: StartMaintenanceDto
    ): Promise<MaintenanceDto> {
        return this.startMaintenanceService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds maintenances',
        responses: [
            {
                status: 200,
                description: 'Maintenances found',
                model: MaintenanceDto,
            },
        ],
    })
    @Authorize(MaintenancePermission.VIEW)
    @Get()
    async listMaintenance(
        @RequestActor() actor: Actor,
        @Query() payload: ListMaintenanceDto
    ): Promise<PaginatedDto<MaintenanceDto>> {
        return this.listMaintenanceService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a maintenance',
        parameters: [entityIdParam('Maintenance ID')],
        responses: [
            {
                status: 200,
                description: 'Maintenance found',
                type: MaintenanceDto,
            },
        ],
    })
    @Authorize(MaintenancePermission.VIEW)
    @Get(':id')
    async getMaintenance(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getMaintenanceSchema.shape.id) id: RoomStatusId
    ): Promise<MaintenanceDto> {
        return this.getMaintenanceService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Gets a maintenance by room ID',
        parameters: [entityIdParam('Room ID')],
        responses: [
            {
                status: 200,
                description: 'Maintenance found',
                type: MaintenanceDto,
            },
        ],
    })
    @Authorize(MaintenancePermission.VIEW)
    @Get('room/:id')
    async getMaintenanceByRoom(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getMaintenanceByRoomSchema.shape.id) id: RoomId
    ): Promise<MaintenanceDto> {
        return this.getMaintenanceByRoomService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a maintenance',
        parameters: [entityIdParam('Maintenance ID')],
        responses: [
            {
                status: 200,
                description: 'Maintenance updated',
                type: MaintenanceDto,
            },
        ],
    })
    @Authorize(MaintenancePermission.UPDATE)
    @Put(':id')
    async updateMaintenance(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateMaintenanceSchema.shape.id) id: RoomStatusId,
        @Body() payload: UpdateMaintenanceInputDto
    ): Promise<MaintenanceDto> {
        return this.updateMaintenanceService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Finish a maintenance',
        parameters: [entityIdParam('Maintenance ID', 'roomId')],
        responses: [
            {
                status: 200,
                description: 'Maintenance finished',
            },
        ],
    })
    @Authorize(MaintenancePermission.FINISH)
    @Patch('room/:roomId/finish')
    async finishMaintenance(
        @RequestActor() actor: Actor,
        @ValidatedParam('roomId', finishMaintenanceSchema.shape.roomId) roomId: RoomId
    ): Promise<MaintenanceDto> {
        return this.finishMaintenanceService.execute({actor, payload: {roomId}});
    }
}
