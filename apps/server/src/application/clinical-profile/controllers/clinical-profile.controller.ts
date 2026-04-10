import {Body, Controller, Get, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {PatientId} from '../../../domain/patient/entities';
import {ClinicalProfilePermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {getClinicalProfileSchema, upsertClinicalProfileSchema, ClinicalProfileDto, UpsertClinicalProfileInputDto} from '../dtos';
import {GetClinicalProfileService, UpsertClinicalProfileService} from '../services';

@ApiTags('ClinicalProfile')
@Controller('patients/:patientId/clinical-profile')
export class ClinicalProfileController {
    constructor(
        private readonly getClinicalProfileService: GetClinicalProfileService,
        private readonly upsertClinicalProfileService: UpsertClinicalProfileService
    ) {}

    @ApiOperation({
        summary: 'Gets the clinical profile of a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Clinical profile found or null', type: ClinicalProfileDto}],
    })
    @Authorize(ClinicalProfilePermission.VIEW)
    @Get()
    async getClinicalProfile(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', getClinicalProfileSchema.shape.patientId) patientId: PatientId
    ): Promise<ClinicalProfileDto | null> {
        return this.getClinicalProfileService.execute({actor, payload: {patientId}});
    }

    @ApiOperation({
        summary: 'Creates or updates the clinical profile of a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Clinical profile upserted', type: ClinicalProfileDto}],
    })
    @Authorize(ClinicalProfilePermission.UPDATE)
    @Put()
    async upsertClinicalProfile(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', upsertClinicalProfileSchema.shape.patientId) patientId: PatientId,
        @Body() payload: UpsertClinicalProfileInputDto
    ): Promise<ClinicalProfileDto> {
        return this.upsertClinicalProfileService.execute({actor, payload: {patientId, ...payload}});
    }
}
