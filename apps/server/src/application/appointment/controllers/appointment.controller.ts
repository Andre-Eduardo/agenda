import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {AppointmentId} from '../../../domain/appointment/entities';
import {AppointmentPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {
    AppointmentDto,
    CreateAppointmentDto,
    SearchAppointmentsDto,
    UpdateAppointmentInputDto,
    getAppointmentSchema,
    searchAppointmentsSchema,
    updateAppointmentSchema,
} from '../dtos';
import {
    CreateAppointmentService,
    DeleteAppointmentService,
    GetAppointmentService,
    SearchAppointmentsService,
    UpdateAppointmentService,
} from '../services';
import {PaginatedDto} from '../../@shared/dto';

@ApiTags('Appointment')
@Controller('appointments')
export class AppointmentController {
    constructor(
        private readonly createAppointmentService: CreateAppointmentService,
        private readonly getAppointmentService: GetAppointmentService,
        private readonly searchAppointmentsService: SearchAppointmentsService,
        private readonly updateAppointmentService: UpdateAppointmentService,
        private readonly deleteAppointmentService: DeleteAppointmentService
    ) {}

    @ApiOperation({
        summary: 'Creates a new appointment',
        responses: [{status: 201, description: 'Appointment created', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.CREATE)
    @Post()
    async createAppointment(
        @RequestActor() actor: Actor,
        @Body() payload: CreateAppointmentDto
    ): Promise<AppointmentDto> {
        return this.createAppointmentService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Lists and searches appointments',
        responses: [{status: 200, description: 'Appointments list'}],
    })
    @Authorize(AppointmentPermission.VIEW)
    @Get()
    async searchAppointments(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(searchAppointmentsSchema)) query: SearchAppointmentsDto
    ): Promise<PaginatedDto<AppointmentDto>> {
        return this.searchAppointmentsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Gets an appointment by ID',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment found', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.VIEW)
    @Get(':id')
    async getAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.getAppointmentService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates an appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment updated', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.UPDATE)
    @Put(':id')
    async updateAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateAppointmentSchema.shape.id) id: AppointmentId,
        @Body() payload: UpdateAppointmentInputDto
    ): Promise<AppointmentDto> {
        return this.updateAppointmentService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes an appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment deleted'}],
    })
    @Authorize(AppointmentPermission.DELETE)
    @Delete(':id')
    async deleteAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<void> {
        await this.deleteAppointmentService.execute({actor, payload: {id}});
    }
}
