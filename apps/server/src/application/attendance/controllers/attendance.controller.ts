import {Body, Controller, Get, Header, HttpCode, Post, Put, Query} from '@nestjs/common';
import {ApiOkResponse, ApiParam, ApiTags} from '@nestjs/swagger';
import {Authorize, RequestActor} from '@application/@shared/auth';
import {ValidatedParam} from '@application/@shared/validation';
import {AppointmentDto, checkinAppointmentSchema} from '@application/appointment/dtos';
import {
    AppointmentTriageDto,
    AttendanceCallResultDto,
    AttendanceQueueDto,
    CallAttendanceDto,
    ListAttendanceDto,
    SaveTriageDto,
} from '@application/attendance/dtos';
import {AttendanceService} from '@application/attendance/services';
import {Actor} from '@domain/@shared/actor';
import {AppointmentId} from '@domain/appointment/entities';
import {AppointmentPermission} from '@domain/auth';

const appointmentIdParam = checkinAppointmentSchema.shape.id;

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendance: AttendanceService) {}

    @Authorize(AppointmentPermission.VIEW)
    @Get()
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: AttendanceQueueDto})
    listAttendance(@RequestActor() actor: Actor, @Query() query: ListAttendanceDto): Promise<AttendanceQueueDto> {
        return this.attendance.list(actor, query);
    }

    @Authorize(AppointmentPermission.CALL)
    @Post(':id/calls')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @HttpCode(200)
    @ApiOkResponse({type: AttendanceCallResultDto})
    callAttendance(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdParam) id: AppointmentId,
        @Body() {destination}: CallAttendanceDto
    ): Promise<AttendanceCallResultDto> {
        return this.attendance.call(actor, id, destination);
    }

    @Authorize(AppointmentPermission.UPDATE)
    @Post(':id/finish')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @HttpCode(200)
    @ApiOkResponse({type: AppointmentDto})
    finishAttendance(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdParam) id: AppointmentId
    ): Promise<AppointmentDto> {
        return this.attendance.finish(actor, id);
    }

    @Authorize(AppointmentPermission.VIEW)
    @Get(':id/triage')
    @Header('Cache-Control', 'no-store')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @ApiOkResponse({type: AppointmentTriageDto})
    getAttendanceTriage(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdParam) id: AppointmentId
    ): Promise<AppointmentTriageDto> {
        return this.attendance.getTriage(actor, id);
    }

    @Authorize(AppointmentPermission.TRIAGE)
    @Put(':id/triage')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @ApiOkResponse({type: AppointmentTriageDto})
    saveAttendanceTriage(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdParam) id: AppointmentId,
        @Body() payload: SaveTriageDto
    ): Promise<AppointmentTriageDto> {
        return this.attendance.saveTriage(actor, id, payload);
    }
}
