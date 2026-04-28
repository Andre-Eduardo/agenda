import {Controller, Get, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {PatientId} from '../../../domain/patient/entities';
import {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import {PatientFormPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {entityId} from '../../@shared/validation/schemas';
import {FormAiContextService, AiContextPayload} from '../services';

const aiContextFilterSchema = z.object({
    specialty: z.nativeEnum(AiSpecialtyGroup).optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    onlyCompleted: z.coerce.boolean().optional(),
    format: z.enum(['full', 'compact', 'timeline']).optional().default('full'),
});

const patientParamSchema = z.object({
    patientId: entityId(PatientId),
});

@ApiTags('FormAiContext')
@Controller('patients/:patientId/ai-context')
export class FormAiContextController {
    constructor(private readonly aiContextService: FormAiContextService) {}

    @ApiOperation({
        summary: 'Get structured AI context payload for a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'AI context payload'}],
    })
    @Authorize(PatientFormPermission.VIEW)
    @Get()
    async getAiContext(
        @RequestActor() _actor: Actor,
        @ValidatedParam('patientId', patientParamSchema.shape.patientId) patientId: PatientId,
        @Query(new ZodValidationPipe(aiContextFilterSchema)) query: z.infer<typeof aiContextFilterSchema>
    ): Promise<AiContextPayload | string> {
        const filter = {
            specialty: query.specialty,
            fromDate: query.fromDate,
            toDate: query.toDate,
            onlyCompleted: query.onlyCompleted,
        };

        if (query.format === 'timeline') {
            return this.aiContextService.buildTextTimeline(patientId, filter);
        }

        return this.aiContextService.buildForPatient(patientId, filter);
    }
}
