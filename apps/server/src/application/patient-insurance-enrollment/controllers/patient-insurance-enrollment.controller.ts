import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    CreatePatientInsuranceEnrollmentInputDto,
    PatientInsuranceEnrollmentDto,
    UpdatePatientInsuranceEnrollmentInputDto,
    patientInsuranceEnrollmentPatientParamSchema,
    setPrimaryPatientInsuranceEnrollmentSchema,
    updatePatientInsuranceEnrollmentSchema,
} from '@application/patient-insurance-enrollment/dtos';
import {
    CreatePatientInsuranceEnrollmentService,
    ListPatientInsuranceEnrollmentsService,
    SetPrimaryPatientInsuranceEnrollmentService,
    UpdatePatientInsuranceEnrollmentService,
} from '@application/patient-insurance-enrollment/services';
import {Actor} from '@domain/@shared/actor';
import {PatientInsuranceEnrollmentPermission} from '@domain/auth';
import {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';
import {PatientId} from '@domain/patient/entities';

@ApiTags('PatientInsuranceEnrollment')
@Controller('patients/:patientId/insurance-enrollments')
export class PatientInsuranceEnrollmentController {
    constructor(
        private readonly createEnrollmentService: CreatePatientInsuranceEnrollmentService,
        private readonly listEnrollmentsService: ListPatientInsuranceEnrollmentsService,
        private readonly updateEnrollmentService: UpdatePatientInsuranceEnrollmentService,
        private readonly setPrimaryEnrollmentService: SetPrimaryPatientInsuranceEnrollmentService
    ) {}

    @ApiOperation({
        summary: 'Lists the insurance plans linked to a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Insurance enrollments', type: [PatientInsuranceEnrollmentDto]}],
    })
    @Authorize(PatientInsuranceEnrollmentPermission.VIEW)
    @Get()
    listEnrollments(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientInsuranceEnrollmentPatientParamSchema.shape.patientId)
        patientId: PatientId
    ): Promise<PatientInsuranceEnrollmentDto[]> {
        return this.listEnrollmentsService.execute({actor, payload: {patientId}});
    }

    @ApiOperation({
        summary: 'Links a patient to an insurance plan',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 201, description: 'Enrollment created', type: PatientInsuranceEnrollmentDto}],
    })
    @Authorize(PatientInsuranceEnrollmentPermission.CREATE)
    @Post()
    createEnrollment(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientInsuranceEnrollmentPatientParamSchema.shape.patientId)
        patientId: PatientId,
        @Body() payload: CreatePatientInsuranceEnrollmentInputDto
    ): Promise<PatientInsuranceEnrollmentDto> {
        return this.createEnrollmentService.execute({actor, payload: {patientId, ...payload}});
    }

    @ApiOperation({
        summary: 'Updates an insurance enrollment',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Enrollment ID', 'id')],
        responses: [{status: 200, description: 'Enrollment updated', type: PatientInsuranceEnrollmentDto}],
    })
    @Authorize(PatientInsuranceEnrollmentPermission.UPDATE)
    @Patch(':id')
    updateEnrollment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updatePatientInsuranceEnrollmentSchema.shape.id) id: PatientInsuranceEnrollmentId,
        @Body() payload: UpdatePatientInsuranceEnrollmentInputDto
    ): Promise<PatientInsuranceEnrollmentDto> {
        return this.updateEnrollmentService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Marks an insurance enrollment as the patient primary one',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Enrollment ID', 'id')],
        responses: [{status: 200, description: 'Enrollment marked as primary', type: PatientInsuranceEnrollmentDto}],
    })
    @Authorize(PatientInsuranceEnrollmentPermission.UPDATE)
    @Patch(':id/set-primary')
    setPrimary(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', setPrimaryPatientInsuranceEnrollmentSchema.shape.id) id: PatientInsuranceEnrollmentId
    ): Promise<PatientInsuranceEnrollmentDto> {
        return this.setPrimaryEnrollmentService.execute({actor, payload: {id}});
    }
}
