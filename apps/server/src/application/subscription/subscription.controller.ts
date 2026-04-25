import {Body, Controller, Get, Param, Patch} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../domain/@shared/actor';
import {SubscriptionPermission} from '../../domain/auth';
import {toEnum} from '../../domain/@shared/utils';
import {Authorize} from '../@shared/auth';
import {RequestActor} from '../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../@shared/openapi/decorators';
import {entityIdParam} from '../@shared/openapi/params';
import {SubscriptionDto} from './dto/subscription.dto';
import {CurrentUsageDto, MemberUsageSummaryDto} from './dto/usage.dto';
import {ChangePlanDto} from './dto/change-plan.dto';
import {PlanCodeRecord} from './subscription-plans.config';
import {SubscriptionService} from './subscription.service';

@ApiTags('Subscription')
@Controller('')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @ApiOperation({
        summary: 'Get active subscription for a professional member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 200, description: 'Subscription found', type: SubscriptionDto},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Get('members/:memberId/subscription')
    async getSubscription(
        @RequestActor() _actor: Actor,
        @Param('memberId') memberId: string,
    ): Promise<SubscriptionDto> {
        const sub = await this.subscriptionService.getSubscriptionByMemberId(memberId);
        return new SubscriptionDto(sub);
    }

    @ApiOperation({
        summary: 'Get current period usage for a professional member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 200, description: 'Usage data', type: CurrentUsageDto},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Get('members/:memberId/usage')
    async getMemberUsage(
        @RequestActor() actor: Actor,
        @Param('memberId') memberId: string,
    ): Promise<CurrentUsageDto> {
        const usage = await this.subscriptionService.getCurrentUsage(
            memberId,
            actor.clinicId.toString(),
        );
        return new CurrentUsageDto(usage);
    }

    @ApiOperation({
        summary: 'Get current usage for all professionals in a clinic (admin/owner only)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Usage list', type: [MemberUsageSummaryDto]}],
    })
    @Authorize(SubscriptionPermission.VIEW_CLINIC)
    @Get('clinics/:clinicId/usage')
    async getClinicUsage(
        @RequestActor() _actor: Actor,
        @Param('clinicId') clinicId: string,
    ): Promise<MemberUsageSummaryDto[]> {
        const entries = await this.subscriptionService.getClinicUsage(clinicId);
        return entries.map((e) => new MemberUsageSummaryDto(e.memberId, e.usage));
    }

    @ApiOperation({
        summary: 'Change the plan for a professional member (admin/owner only)',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 200, description: 'Plan updated', type: SubscriptionDto},
            {status: 403, description: 'Not an admin or owner'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(SubscriptionPermission.MANAGE)
    @Patch('members/:memberId/subscription')
    async changePlan(
        @RequestActor() _actor: Actor,
        @Param('memberId') memberId: string,
        @Body() payload: ChangePlanDto,
    ): Promise<SubscriptionDto> {
        const planCode = toEnum(PlanCodeRecord, payload.planCode);
        const sub = await this.subscriptionService.changePlan(memberId, planCode);
        return new SubscriptionDto(sub);
    }
}
