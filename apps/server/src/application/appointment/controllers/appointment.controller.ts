import {Body, Controller, Delete, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {PaginatedDto} from '@application/@shared/dto';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '@application/@shared/validation';
import {
    AppointmentDto,
    CancelAppointmentInputDto,
    CreateAppointmentDto,
    SearchAppointmentsDto,
    UpdateAppointmentInputDto,
    callAppointmentSchema,
    cancelAppointmentSchema,
    checkinAppointmentSchema,
    completeAppointmentSchema,
    confirmAppointmentSchema,
    getAppointmentSchema,
    noShowAppointmentSchema,
    searchAppointmentsSchema,
    updateAppointmentSchema,
} from '@application/appointment/dtos';
import {
    CallAppointmentService,
    CancelAppointmentService,
    CheckinAppointmentService,
    CompleteAppointmentService,
    ConfirmAppointmentService,
    CreateAppointmentService,
    DeleteAppointmentService,
    GetAppointmentService,
    MarkNoShowAppointmentService,
    SearchAppointmentsService,
    UpdateAppointmentService,
} from '@application/appointment/services';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {ListManageableAgendasService} from '@application/professional-agenda-access/services';
import {Actor} from '@domain/@shared/actor';
import {AppointmentId} from '@domain/appointment/entities';
import {AppointmentPermission} from '@domain/auth';

@ApiTags('Appointment')
@Controller('appointments')
export class AppointmentController {
    constructor(
        private readonly createAppointmentService: CreateAppointmentService,
        private readonly getAppointmentService: GetAppointmentService,
        private readonly searchAppointmentsService: SearchAppointmentsService,
        private readonly updateAppointmentService: UpdateAppointmentService,
        private readonly cancelAppointmentService: CancelAppointmentService,
        private readonly deleteAppointmentService: DeleteAppointmentService,
        private readonly checkinAppointmentService: CheckinAppointmentService,
        private readonly callAppointmentService: CallAppointmentService,
        private readonly confirmAppointmentService: ConfirmAppointmentService,
        private readonly completeAppointmentService: CompleteAppointmentService,
        private readonly markNoShowAppointmentService: MarkNoShowAppointmentService,
        private readonly listManageableAgendasService: ListManageableAgendasService
    ) {}

    @ApiOperation({
        summary: 'Creates a new appointment',
        responses: [{status: 201, description: 'Appointment created', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.CREATE)
    @Post()
    createAppointment(@RequestActor() actor: Actor, @Body() payload: CreateAppointmentDto): Promise<AppointmentDto> {
        return this.createAppointmentService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Lists and searches appointments',
        responses: [{status: 200, description: 'Appointments list'}],
    })
    @Authorize(AppointmentPermission.VIEW)
    @Get()
    searchAppointments(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(searchAppointmentsSchema)) query: SearchAppointmentsDto
    ): Promise<PaginatedDto<AppointmentDto>> {
        return this.searchAppointmentsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Lists the agendas (clinic members) the current actor can create appointments for',
        responses: [{status: 200, description: 'Manageable agendas', type: ClinicMemberDto, isArray: true}],
    })
    @Authorize(AppointmentPermission.CREATE)
    @Get('manageable-professionals')
    listManageableProfessionals(@RequestActor() actor: Actor): Promise<ClinicMemberDto[]> {
        return this.listManageableAgendasService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Gets an appointment by ID',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment found', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.VIEW)
    @Get(':id')
    getAppointment(
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
    updateAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateAppointmentSchema.shape.id) id: AppointmentId,
        @Body() payload: UpdateAppointmentInputDto
    ): Promise<AppointmentDto> {
        return this.updateAppointmentService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Cancels an appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment cancelled', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.CANCEL)
    @Patch(':id/cancel')
    cancelAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', cancelAppointmentSchema.shape.id) id: AppointmentId,
        @Body() payload: CancelAppointmentInputDto
    ): Promise<AppointmentDto> {
        return this.cancelAppointmentService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Checks in a patient at the reception (SCHEDULED/CONFIRMED → ARRIVED)',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Patient checked in', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.CHECKIN)
    @Patch(':id/checkin')
    checkinAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', checkinAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.checkinAppointmentService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Calls the patient to the room (ARRIVED → IN_PROGRESS)',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Patient called', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.CALL)
    @Patch(':id/call')
    callAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', callAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.callAppointmentService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Confirms an appointment (SCHEDULED → CONFIRMED)',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment confirmed', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.UPDATE)
    @Patch(':id/confirm')
    confirmAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', confirmAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.confirmAppointmentService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Completes an appointment (SCHEDULED/CONFIRMED/IN_PROGRESS → COMPLETED)',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment completed', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.UPDATE)
    @Patch(':id/complete')
    completeAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', completeAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.completeAppointmentService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Marks an appointment as no-show (SCHEDULED/CONFIRMED/ARRIVED → NO_SHOW)',
        parameters: [entityIdParam('Appointment ID')],
        responses: [{status: 200, description: 'Appointment marked as no-show', type: AppointmentDto}],
    })
    @Authorize(AppointmentPermission.UPDATE)
    @Patch(':id/no-show')
    markNoShowAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', noShowAppointmentSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.markNoShowAppointmentService.execute({actor, payload: {id}});
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
