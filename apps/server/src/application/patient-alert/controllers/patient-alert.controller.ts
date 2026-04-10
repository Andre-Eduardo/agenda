import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {PatientId} from '../../../domain/patient/entities';
import {PatientAlertId} from '../../../domain/patient-alert/entities';
import {PatientAlertPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {
    PatientAlertDto,
    CreatePatientAlertInputDto,
    UpdatePatientAlertInputDto,
    searchPatientAlertsSchema,
    SearchPatientAlertsDto,
    patientAlertParamsSchema,
    patientAlertPatientParamSchema,
} from '../dtos';
import {
    CreatePatientAlertService,
    DeletePatientAlertService,
    SearchPatientAlertsService,
    UpdatePatientAlertService,
} from '../services';

@ApiTags('PatientAlert')
@Controller('patients/:patientId/alerts')
export class PatientAlertController {
    constructor(
        private readonly createPatientAlertService: CreatePatientAlertService,
        private readonly searchPatientAlertsService: SearchPatientAlertsService,
        private readonly updatePatientAlertService: UpdatePatientAlertService,
        private readonly deletePatientAlertService: DeletePatientAlertService
    ) {}

    @ApiOperation({
        summary: 'Lists clinical alerts for a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'List of patient alerts'}],
    })
    @Authorize(PatientAlertPermission.VIEW)
    @Get()
    async searchPatientAlerts(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientAlertPatientParamSchema.shape.patientId) patientId: PatientId,
        @Query(new ZodValidationPipe(searchPatientAlertsSchema)) query: SearchPatientAlertsDto
    ): Promise<PaginatedDto<PatientAlertDto>> {
        return this.searchPatientAlertsService.execute({actor, payload: {...query, patientId}});
    }

    @ApiOperation({
        summary: 'Creates a clinical alert for a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 201, description: 'Alert created', type: PatientAlertDto}],
    })
    @Authorize(PatientAlertPermission.CREATE)
    @Post()
    async createPatientAlert(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientAlertPatientParamSchema.shape.patientId) patientId: PatientId,
        @Body() payload: CreatePatientAlertInputDto
    ): Promise<PatientAlertDto> {
        return this.createPatientAlertService.execute({actor, payload: {patientId, ...payload}});
    }

    @ApiOperation({
        summary: 'Updates a clinical alert',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Alert ID', 'alertId')],
        responses: [{status: 200, description: 'Alert updated', type: PatientAlertDto}],
    })
    @Authorize(PatientAlertPermission.UPDATE)
    @Put(':alertId')
    async updatePatientAlert(
        @RequestActor() actor: Actor,
        @ValidatedParam('alertId', patientAlertParamsSchema.shape.alertId) alertId: PatientAlertId,
        @Body() payload: UpdatePatientAlertInputDto
    ): Promise<PatientAlertDto> {
        return this.updatePatientAlertService.execute({actor, payload: {alertId, ...payload}});
    }

    @ApiOperation({
        summary: 'Soft-deletes a clinical alert',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Alert ID', 'alertId')],
        responses: [{status: 200, description: 'Alert deleted'}],
    })
    @Authorize(PatientAlertPermission.DELETE)
    @Delete(':alertId')
    async deletePatientAlert(
        @RequestActor() actor: Actor,
        @ValidatedParam('alertId', patientAlertParamsSchema.shape.alertId) alertId: PatientAlertId
    ): Promise<void> {
        await this.deletePatientAlertService.execute({actor, payload: {alertId}});
    }
}
