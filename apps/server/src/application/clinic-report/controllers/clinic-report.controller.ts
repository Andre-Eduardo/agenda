import {Controller, Get, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {ZodValidationPipe} from '@application/@shared/validation';
import {
    AppointmentReportDto,
    getAppointmentReportSchema,
    GetAppointmentReportDto,
} from '@application/clinic-report/dtos';
import {GetAppointmentReportService} from '@application/clinic-report/services';
import {Actor} from '@domain/@shared/actor';
import {ClinicReportPermission} from '@domain/auth';

@ApiTags('Clinic Report')
@Controller('reports')
export class ClinicReportController {
    constructor(private readonly getAppointmentReportService: GetAppointmentReportService) {}

    @ApiOperation({
        summary: "Gets the operational appointment report of the actor's clinic",
        responses: [
            {status: 200, description: 'Appointment report', type: AppointmentReportDto},
            {status: 400, description: 'Invalid period or time zone'},
        ],
    })
    @Authorize(ClinicReportPermission.VIEW)
    @Get('appointments')
    getAppointmentReport(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(getAppointmentReportSchema)) query: GetAppointmentReportDto
    ): Promise<AppointmentReportDto> {
        return this.getAppointmentReportService.execute({actor, payload: query});
    }
}
