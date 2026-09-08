import {Body, Controller, Get, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    PatientPackageCreditDto,
    PatientPackageDto,
    SellPatientPackageInputDto,
    patientPackageCreditHistoryParamSchema,
    patientPackagePatientParamSchema,
} from '@application/patient-package/dtos';
import {
    GetPatientPackageCreditHistoryService,
    GetPatientPackagesService,
    SellPatientPackageService,
} from '@application/patient-package/services';
import {Actor} from '@domain/@shared/actor';
import {PatientPackagePermission} from '@domain/auth';
import {PatientPackageId} from '@domain/patient-package/entities';
import {PatientId} from '@domain/patient/entities';

@ApiTags('PatientPackage')
@Controller('patients/:patientId/packages')
export class PatientPackageController {
    constructor(
        private readonly getPatientPackagesService: GetPatientPackagesService,
        private readonly sellPatientPackageService: SellPatientPackageService,
        private readonly getCreditHistoryService: GetPatientPackageCreditHistoryService
    ) {}

    @ApiOperation({
        summary: 'Lists the session packages purchased by a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Patient packages', type: [PatientPackageDto]}],
    })
    @Authorize(PatientPackagePermission.VIEW)
    @Get()
    listPackages(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientPackagePatientParamSchema.shape.patientId) patientId: PatientId
    ): Promise<PatientPackageDto[]> {
        return this.getPatientPackagesService.execute({actor, payload: {patientId}});
    }

    @ApiOperation({
        summary: 'Sells a session package to a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 201, description: 'Package sold', type: PatientPackageDto}],
    })
    @Authorize(PatientPackagePermission.SELL)
    @Post()
    sellPackage(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientPackagePatientParamSchema.shape.patientId) patientId: PatientId,
        @Body() payload: SellPatientPackageInputDto
    ): Promise<PatientPackageDto> {
        return this.sellPatientPackageService.execute({actor, payload: {patientId, ...payload}});
    }

    @ApiOperation({
        summary: 'Lists the credit ledger (consumption/refund history) for a package',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Package ID', 'id')],
        responses: [{status: 200, description: 'Credit history', type: [PatientPackageCreditDto]}],
    })
    @Authorize(PatientPackagePermission.VIEW)
    @Get(':id/credits')
    getCreditHistory(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientPackageCreditHistoryParamSchema.shape.patientId) patientId: PatientId,
        @ValidatedParam('id', patientPackageCreditHistoryParamSchema.shape.id) id: PatientPackageId
    ): Promise<PatientPackageCreditDto[]> {
        return this.getCreditHistoryService.execute({actor, payload: {patientId, id}});
    }
}
