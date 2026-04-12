import {Controller, Get, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {PatientId} from '../../../domain/patient/entities';
import {PatientFormId} from '../../../domain/patient-form/entities';
import {Specialty} from '../../../domain/form-template/entities';
import {PatientFormPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {entityId} from '../../@shared/validation/schemas';
import {FormFieldIndexDto} from '../dtos';
import {FormFieldIndexerService} from '../services';

const searchIndexSchema = z.object({
    specialty: z.nativeEnum(Specialty).optional(),
    fieldId: z.string().optional(),
    patientFormId: entityId(PatientFormId).optional(),
});

const patientParamSchema = z.object({
    patientId: entityId(PatientId),
});

@ApiTags('FormFieldIndex')
@Controller()
export class FormFieldIndexController {
    constructor(private readonly indexerService: FormFieldIndexerService) {}

    @ApiOperation({
        summary: "List indexed fields from a patient's forms",
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Indexed fields'}],
    })
    @Authorize(PatientFormPermission.VIEW)
    @Get('patients/:patientId/form-field-index')
    async listByPatient(
        @RequestActor() _actor: Actor,
        @ValidatedParam('patientId', patientParamSchema.shape.patientId) _patientId: PatientId,
        @Query(new ZodValidationPipe(searchIndexSchema)) query: z.infer<typeof searchIndexSchema>
    ): Promise<FormFieldIndexDto[]> {
        const results = await this.indexerService.search({
            fieldId: query.fieldId,
            specialty: query.specialty,
        });
        return results.map((r) => new FormFieldIndexDto(r));
    }

    @ApiOperation({
        summary: 'Search indexed fields across all patients',
        responses: [{status: 200, description: 'Indexed fields'}],
    })
    @Authorize(PatientFormPermission.VIEW)
    @Get('form-field-index/search')
    async globalSearch(
        @RequestActor() _actor: Actor,
        @Query(new ZodValidationPipe(searchIndexSchema)) query: z.infer<typeof searchIndexSchema>
    ): Promise<FormFieldIndexDto[]> {
        const results = await this.indexerService.search({
            patientFormId: query.patientFormId,
            fieldId: query.fieldId,
            specialty: query.specialty,
        });
        return results.map((r) => new FormFieldIndexDto(r));
    }
}
