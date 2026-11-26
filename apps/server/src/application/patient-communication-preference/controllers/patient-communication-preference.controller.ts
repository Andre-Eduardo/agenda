import {Body, Controller, Get, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    PatientCommunicationPreferencesDto,
    UpdatePatientCommunicationPreferenceInputDto,
    patientCommunicationPreferenceParamSchema,
} from '@application/patient-communication-preference/dtos';
import {
    GetPatientCommunicationPreferencesService,
    UpdatePatientCommunicationPreferenceService,
} from '@application/patient-communication-preference/services';
import {Actor} from '@domain/@shared/actor';
import {PatientPermission} from '@domain/auth';
import {PatientId} from '@domain/patient/entities';

@ApiTags('PatientCommunicationPreference')
@Controller('patients/:patientId/communication-preferences')
export class PatientCommunicationPreferenceController {
    constructor(
        private readonly getService: GetPatientCommunicationPreferencesService,
        private readonly updateService: UpdatePatientCommunicationPreferenceService
    ) {}

    @ApiOperation({
        summary: "Gets the patient's communication preferences (opt-out per channel) and their history",
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Communication preferences', type: PatientCommunicationPreferencesDto}],
    })
    @Authorize(PatientPermission.VIEW)
    @Get()
    getPatientCommunicationPreferences(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientCommunicationPreferenceParamSchema.shape.patientId) patientId: PatientId
    ): Promise<PatientCommunicationPreferencesDto> {
        return this.getService.execute({actor, payload: {patientId}});
    }

    @ApiOperation({
        summary: "Records the patient's choice for one channel (opt-out or opt-in)",
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Updated preferences', type: PatientCommunicationPreferencesDto}],
    })
    @Authorize(PatientPermission.UPDATE)
    @Put()
    updatePatientCommunicationPreference(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientCommunicationPreferenceParamSchema.shape.patientId) patientId: PatientId,
        @Body() payload: UpdatePatientCommunicationPreferenceInputDto
    ): Promise<PatientCommunicationPreferencesDto> {
        return this.updateService.execute({actor, payload: {patientId, ...payload}});
    }
}
