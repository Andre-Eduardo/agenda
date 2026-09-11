import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {
    CreatePatientSubscriptionPlanDto,
    PatientSubscriptionPlanDto,
    UpdatePatientSubscriptionPlanInputDto,
    deactivatePatientSubscriptionPlanSchema,
    updatePatientSubscriptionPlanSchema,
} from '@application/patient-subscription-plan/dtos';
import {
    CreatePatientSubscriptionPlanService,
    DeactivatePatientSubscriptionPlanService,
    ListPatientSubscriptionPlansService,
    UpdatePatientSubscriptionPlanService,
} from '@application/patient-subscription-plan/services';
import {Actor} from '@domain/@shared/actor';
import {PatientSubscriptionPlanPermission} from '@domain/auth';
import {PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';

@ApiTags('PatientSubscriptionPlan')
@Controller('patient-subscription-plans')
export class PatientSubscriptionPlanController {
    constructor(
        private readonly createPlanService: CreatePatientSubscriptionPlanService,
        private readonly listPlansService: ListPatientSubscriptionPlansService,
        private readonly updatePlanService: UpdatePatientSubscriptionPlanService,
        private readonly deactivatePlanService: DeactivatePatientSubscriptionPlanService
    ) {}

    @ApiOperation({
        summary: 'Lists the subscription plan catalog for the current clinic',
        responses: [{status: 200, description: 'Subscription plans', type: [PatientSubscriptionPlanDto]}],
    })
    @Authorize(PatientSubscriptionPlanPermission.VIEW)
    @Get()
    listPlans(@RequestActor() actor: Actor): Promise<PatientSubscriptionPlanDto[]> {
        return this.listPlansService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Creates a patient subscription plan in the catalog',
        responses: [{status: 201, description: 'Subscription plan created', type: PatientSubscriptionPlanDto}],
    })
    @Authorize(PatientSubscriptionPlanPermission.CREATE)
    @Post()
    createPlan(
        @RequestActor() actor: Actor,
        @Body() payload: CreatePatientSubscriptionPlanDto
    ): Promise<PatientSubscriptionPlanDto> {
        return this.createPlanService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a patient subscription plan',
        parameters: [entityIdParam('Subscription plan ID')],
        responses: [{status: 200, description: 'Subscription plan updated', type: PatientSubscriptionPlanDto}],
    })
    @Authorize(PatientSubscriptionPlanPermission.UPDATE)
    @Patch(':id')
    updatePlan(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updatePatientSubscriptionPlanSchema.shape.id) id: PatientSubscriptionPlanId,
        @Body() payload: UpdatePatientSubscriptionPlanInputDto
    ): Promise<PatientSubscriptionPlanDto> {
        return this.updatePlanService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deactivates a patient subscription plan',
        parameters: [entityIdParam('Subscription plan ID')],
        responses: [{status: 200, description: 'Subscription plan deactivated', type: PatientSubscriptionPlanDto}],
    })
    @Authorize(PatientSubscriptionPlanPermission.UPDATE)
    @Patch(':id/deactivate')
    deactivatePlan(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deactivatePatientSubscriptionPlanSchema.shape.id) id: PatientSubscriptionPlanId
    ): Promise<PatientSubscriptionPlanDto> {
        return this.deactivatePlanService.execute({actor, payload: {id}});
    }
}
