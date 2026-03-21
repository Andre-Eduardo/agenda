import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {PatientId} from '../../../domain/patient/entities';
import {PatientPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {
    CreatePatientDto,
    PatientDto,
    SearchPatientsDto,
    UpdatePatientInputDto,
    getPatientSchema,
    searchPatientsSchema,
    updatePatientSchema,
} from '../dtos';
import {
    CreatePatientService,
    DeletePatientService,
    GetPatientService,
    SearchPatientsService,
    UpdatePatientService,
} from '../services';

@ApiTags('Patient')
@Controller('patients')
export class PatientController {
    constructor(
        private readonly createPatientService: CreatePatientService,
        private readonly getPatientService: GetPatientService,
        private readonly searchPatientsService: SearchPatientsService,
        private readonly updatePatientService: UpdatePatientService,
        private readonly deletePatientService: DeletePatientService
    ) {}

    @ApiOperation({
        summary: 'Creates a new patient',
        responses: [{status: 201, description: 'Patient created', type: PatientDto}],
    })
    @Authorize(PatientPermission.CREATE)
    @Post()
    async createPatient(@RequestActor() actor: Actor, @Body() payload: CreatePatientDto): Promise<PatientDto> {
        return this.createPatientService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Lists and searches patients',
        responses: [{status: 200, description: 'Patients list'}],
    })
    @Authorize(PatientPermission.VIEW)
    @Get()
    async searchPatients(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(searchPatientsSchema)) query: SearchPatientsDto
    ): Promise<PaginatedDto<PatientDto>> {
        return this.searchPatientsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Gets a patient by ID',
        parameters: [entityIdParam('Patient ID')],
        responses: [{status: 200, description: 'Patient found', type: PatientDto}],
    })
    @Authorize(PatientPermission.VIEW)
    @Get(':id')
    async getPatient(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getPatientSchema.shape.id) id: PatientId
    ): Promise<PatientDto> {
        return this.getPatientService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a patient',
        parameters: [entityIdParam('Patient ID')],
        responses: [{status: 200, description: 'Patient updated', type: PatientDto}],
    })
    @Authorize(PatientPermission.UPDATE)
    @Put(':id')
    async updatePatient(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updatePatientSchema.shape.id) id: PatientId,
        @Body() payload: UpdatePatientInputDto
    ): Promise<PatientDto> {
        return this.updatePatientService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a patient',
        parameters: [entityIdParam('Patient ID')],
        responses: [{status: 200, description: 'Patient deleted'}],
    })
    @Authorize(PatientPermission.DELETE)
    @Delete(':id')
    async deletePatient(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getPatientSchema.shape.id) id: PatientId
    ): Promise<void> {
        await this.deletePatientService.execute({actor, payload: {id}});
    }
}
