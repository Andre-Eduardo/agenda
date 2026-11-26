import {Body, Controller, Delete, Get, Header, Headers, HttpCode, Post, Put} from '@nestjs/common';
import {ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiParam, ApiTags} from '@nestjs/swagger';
import {Authorize, Public, RequestActor} from '@application/@shared/auth';
import {ValidatedParam} from '@application/@shared/validation';
import {checkinAppointmentSchema} from '@application/appointment/dtos';
import {
    AnnouncePatientCallDto,
    PatientCallAvailabilityDto,
    PatientCallPanelSettingsDto,
    PatientCallQueueEntryDto,
    PatientCallQueueItemDto,
    PublicPatientCallPanelDto,
    RecallPatientCallDto,
    RemovePatientCallDto,
    SavePatientCallPanelDto,
} from '@application/patient-call/dtos';
import {PatientCallPanelService, PatientCallQueueService} from '@application/patient-call/services';
import {Actor} from '@domain/@shared/actor';
import {AppointmentId} from '@domain/appointment/entities';
import {AppointmentPermission, PatientCallPermission} from '@domain/auth';

@ApiTags('Patient Call')
@Controller('patient-call')
export class PatientCallController {
    constructor(
        private readonly panels: PatientCallPanelService,
        private readonly queue: PatientCallQueueService
    ) {}

    @Authorize(AppointmentPermission.VIEW)
    @Get('availability')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallAvailabilityDto})
    getPatientCallAvailability(@RequestActor() actor: Actor): Promise<PatientCallAvailabilityDto> {
        return this.panels.getAvailability(actor.clinicId);
    }

    @Authorize(PatientCallPermission.CONFIGURE)
    @Get('settings')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallPanelSettingsDto})
    getPatientCallSettings(@RequestActor() actor: Actor): Promise<PatientCallPanelSettingsDto> {
        return this.panels.getSettings(actor.clinicId);
    }

    @Authorize(PatientCallPermission.CONFIGURE)
    @Put('settings')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallPanelSettingsDto})
    savePatientCallSettings(
        @RequestActor() actor: Actor,
        @Body() identity: SavePatientCallPanelDto
    ): Promise<PatientCallPanelSettingsDto> {
        return this.panels.saveSettings(actor.clinicId, identity);
    }

    @Authorize(PatientCallPermission.CONFIGURE)
    @Put('link')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallPanelSettingsDto})
    publishPatientCallLink(@RequestActor() actor: Actor): Promise<PatientCallPanelSettingsDto> {
        return this.panels.publish(actor.clinicId);
    }

    @Authorize(PatientCallPermission.CONFIGURE)
    @Delete('link')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallPanelSettingsDto})
    revokePatientCallLink(@RequestActor() actor: Actor): Promise<PatientCallPanelSettingsDto> {
        return this.panels.revoke(actor.clinicId);
    }

    @Public()
    @Get('display')
    @Header('Cache-Control', 'no-store')
    @Header('X-Robots-Tag', 'noindex, nofollow')
    @ApiHeader({name: 'x-patient-call-token', required: true, schema: {type: 'string'}})
    @ApiOkResponse({type: PublicPatientCallPanelDto})
    getPatientCallDisplay(
        @Headers('x-patient-call-token') token: string | undefined
    ): Promise<PublicPatientCallPanelDto> {
        return this.panels.getDisplay(token);
    }

    @Authorize(PatientCallPermission.OPERATE)
    @Get('queue')
    @Header('Cache-Control', 'no-store')
    @ApiOkResponse({type: PatientCallQueueItemDto, isArray: true})
    listPatientCallQueue(@RequestActor() actor: Actor): Promise<PatientCallQueueItemDto[]> {
        return this.queue.list(actor);
    }

    @Authorize(PatientCallPermission.OPERATE)
    @Post('queue/:id/announcements')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @HttpCode(200)
    @ApiOkResponse({type: PatientCallQueueEntryDto})
    announcePatientCall(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', checkinAppointmentSchema.shape.id) id: AppointmentId,
        @Body() {place, number}: AnnouncePatientCallDto
    ): Promise<PatientCallQueueEntryDto> {
        return this.queue.announce(actor, id, place, number);
    }

    @Authorize(PatientCallPermission.OPERATE)
    @Post('queue/:id/recalls')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @HttpCode(200)
    @ApiOkResponse({type: PatientCallQueueEntryDto})
    recallPatientCall(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', checkinAppointmentSchema.shape.id) id: AppointmentId,
        @Body() {callCount}: RecallPatientCallDto
    ): Promise<PatientCallQueueEntryDto> {
        return this.queue.recall(actor, id, callCount);
    }

    @Authorize(PatientCallPermission.OPERATE)
    @Post('queue/:id/removals')
    @ApiParam({name: 'id', type: String, format: 'uuid'})
    @HttpCode(204)
    @ApiNoContentResponse()
    removePatientCall(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', checkinAppointmentSchema.shape.id) id: AppointmentId,
        @Body() {reason}: RemovePatientCallDto
    ): Promise<void> {
        return this.queue.remove(actor, id, reason);
    }
}
