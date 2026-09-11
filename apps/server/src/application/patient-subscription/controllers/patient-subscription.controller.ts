import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    CancelPatientSubscriptionInputDto,
    PatientSubscriptionDto,
    SubscribePatientInputDto,
    cancelPatientSubscriptionSchema,
    patientSubscriptionPatientParamSchema,
} from '@application/patient-subscription/dtos';
import {
    CancelPatientSubscriptionService,
    ListPatientSubscriptionsService,
    SubscribePatientService,
} from '@application/patient-subscription/services';
import {Actor} from '@domain/@shared/actor';
import {PatientSubscriptionPermission} from '@domain/auth';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities';
import {PatientId} from '@domain/patient/entities';

@ApiTags('PatientSubscription')
@Controller('patients/:patientId/subscriptions')
export class PatientSubscriptionController {
    constructor(
        private readonly listSubscriptionsService: ListPatientSubscriptionsService,
        private readonly subscribePatientService: SubscribePatientService,
        private readonly cancelSubscriptionService: CancelPatientSubscriptionService
    ) {}

    @ApiOperation({
        summary: 'Lists the subscription history for a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Patient subscriptions', type: [PatientSubscriptionDto]}],
    })
    @Authorize(PatientSubscriptionPermission.VIEW)
    @Get()
    listSubscriptions(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientSubscriptionPatientParamSchema.shape.patientId) patientId: PatientId
    ): Promise<PatientSubscriptionDto[]> {
        return this.listSubscriptionsService.execute({actor, payload: {patientId}});
    }

    @ApiOperation({
        summary: 'Subscribes a patient to a recurring plan (fails if one is already active)',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 201, description: 'Subscription created', type: PatientSubscriptionDto}],
    })
    @Authorize(PatientSubscriptionPermission.SUBSCRIBE)
    @Post()
    subscribe(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', patientSubscriptionPatientParamSchema.shape.patientId) patientId: PatientId,
        @Body() payload: SubscribePatientInputDto
    ): Promise<PatientSubscriptionDto> {
        return this.subscribePatientService.execute({actor, payload: {patientId, ...payload}});
    }

    @ApiOperation({
        summary: 'Cancels a patient subscription',
        parameters: [entityIdParam('Patient ID', 'patientId'), entityIdParam('Subscription ID', 'id')],
        responses: [{status: 200, description: 'Subscription cancelled', type: PatientSubscriptionDto}],
    })
    @Authorize(PatientSubscriptionPermission.CANCEL)
    @Patch(':id/cancel')
    cancel(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', cancelPatientSubscriptionSchema.shape.id) id: PatientSubscriptionId,
        @Body() payload: CancelPatientSubscriptionInputDto
    ): Promise<PatientSubscriptionDto> {
        return this.cancelSubscriptionService.execute({actor, payload: {id, ...payload}});
    }
}
