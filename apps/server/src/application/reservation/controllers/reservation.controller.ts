import {Body, Controller, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ReservationPermission} from '../../../domain/auth';
import {ReservationId} from '../../../domain/reservation/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    ReservationDto,
    getReservationSchema,
    ListReservationDto,
    CreateReservationDto,
    updateReservationSchema,
    UpdateReservationInputDto,
    cancelReservationSchema,
    CancelReservationInputDto,
} from '../dtos';
import {
    CancelReservationService,
    CreateReservationService,
    GetReservationService,
    ListReservationService,
    UpdateReservationService,
} from '../services';

@ApiTags('Reservation')
@Controller('reservation')
export class ReservationController {
    constructor(
        private readonly cancelReservationService: CancelReservationService,
        private readonly createReservationService: CreateReservationService,
        private readonly getReservationService: GetReservationService,
        private readonly listReservationService: ListReservationService,
        private readonly updateReservationService: UpdateReservationService
    ) {}

    @ApiOperation({
        summary: 'Creates a new reservation',
        responses: [
            {
                status: 201,
                description: 'Reservation created',
                type: ReservationDto,
            },
        ],
    })
    @Authorize(ReservationPermission.CREATE)
    @Post()
    async createReservation(
        @RequestActor() actor: Actor,
        @Body() payload: CreateReservationDto
    ): Promise<ReservationDto> {
        return this.createReservationService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a reservation',
        parameters: [entityIdParam('Reservation ID')],
        responses: [
            {
                status: 200,
                description: 'Reservation found',
                type: ReservationDto,
            },
        ],
    })
    @Authorize(ReservationPermission.VIEW)
    @Get(':id')
    async getReservation(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getReservationSchema.shape.id) id: ReservationId
    ): Promise<ReservationDto> {
        return this.getReservationService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds a reservation',
        responses: [
            {
                status: 200,
                description: 'Reservation found',
                model: ReservationDto,
            },
        ],
    })
    @Authorize(ReservationPermission.VIEW)
    @Get()
    async listReservation(
        @RequestActor() actor: Actor,
        @Query() payload: ListReservationDto
    ): Promise<PaginatedDto<ReservationDto>> {
        return this.listReservationService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a reservation',
        parameters: [entityIdParam('Reservation ID')],
        responses: [
            {
                status: 200,
                description: 'Reservation updated',
                type: ReservationDto,
            },
        ],
    })
    @Authorize(ReservationPermission.UPDATE)
    @Put(':id')
    async updateReservation(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateReservationSchema.shape.id) id: ReservationId,
        @Body() payload: UpdateReservationInputDto
    ): Promise<ReservationDto> {
        return this.updateReservationService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Cancels a reservation',
        parameters: [entityIdParam('Reservation ID')],
        responses: [
            {
                status: 200,
                description: 'Reservation canceled',
                type: ReservationDto,
            },
        ],
    })
    @Authorize(ReservationPermission.CANCEL)
    @Patch(':id')
    async cancelReservation(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', cancelReservationSchema.shape.id) id: ReservationId,
        @Body() payload: CancelReservationInputDto
    ): Promise<ReservationDto> {
        return this.cancelReservationService.execute({actor, payload: {id, ...payload}});
    }
}
