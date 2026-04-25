import {Body, Controller, Get, Param, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../domain/@shared/actor';
import {SubscriptionPermission} from '../../domain/auth';
import {toEnum} from '../../domain/@shared/utils';
import {Authorize} from '../@shared/auth';
import {Public} from '../@shared/auth/public.decorator';
import {RequestActor} from '../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../@shared/openapi/decorators';
import {entityIdParam} from '../@shared/openapi/params';
import {SubscriptionDto} from './dto/subscription.dto';
import {
    ClinicMembersUsageSummaryDto,
    CurrentUsageDto,
    MemberUsageSummaryDto,
} from './dto/usage.dto';
import {ChangePlanDto} from './dto/change-plan.dto';
import {PurchaseAddonDto} from './dto/purchase-addon.dto';
import {AddonCatalogItemDto, MemberActiveAddonsDto, buildAddonCatalogItems} from './dto/addon.dto';
import {ActiveAddonDto} from './dto/usage.dto';
import {AddonCode, PlanCodeRecord} from './subscription-plans.config';
import {SubscriptionService} from './subscription.service';

@ApiTags('Subscription')
@Controller('')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @ApiOperation({
        summary: 'List available add-on packages with prices and grants (public)',
        responses: [{status: 200, description: 'Catalog list', type: [AddonCatalogItemDto]}],
    })
    @Public()
    @Get('addons/catalog')
    getAddonCatalog(): AddonCatalogItemDto[] {
        return buildAddonCatalogItems();
    }

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
        summary: 'Purchase an add-on package for a professional member (admin/owner only)',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 201, description: 'Add-on purchased; returns updated usage', type: CurrentUsageDto},
            {status: 400, description: 'Invalid addon code or quantity'},
            {status: 403, description: 'Not an admin or owner'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(SubscriptionPermission.MANAGE)
    @Post('members/:memberId/addons')
    async purchaseAddon(
        @RequestActor() actor: Actor,
        @Param('memberId') memberId: string,
        @Body() payload: PurchaseAddonDto,
    ): Promise<CurrentUsageDto> {
        const usage = await this.subscriptionService.purchaseAddon(
            memberId,
            actor.clinicId.toString(),
            payload.addonCode as AddonCode,
            payload.quantity,
            actor.clinicMemberId.toString(),
        );
        return new CurrentUsageDto(usage);
    }

    @ApiOperation({
        summary: 'List active add-ons for a professional member in the current month',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [{status: 200, description: 'Active add-ons', type: [ActiveAddonDto]}],
    })
    @Get('members/:memberId/addons')
    async getMemberAddons(
        @RequestActor() actor: Actor,
        @Param('memberId') memberId: string,
    ): Promise<ActiveAddonDto[]> {
        const addons = await this.subscriptionService.getActiveAddonDetails(
            memberId,
            actor.clinicId.toString(),
        );
        return addons.map((a) => new ActiveAddonDto(a));
    }

    @ApiOperation({
        summary: 'Get current usage for all professionals in a clinic with per-member details (admin/owner only)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Clinic-wide usage breakdown', type: ClinicMembersUsageSummaryDto}],
    })
    @Authorize(SubscriptionPermission.VIEW_CLINIC)
    @Get('clinics/:clinicId/members/usage')
    async getClinicMembersUsage(
        @RequestActor() _actor: Actor,
        @Param('clinicId') clinicId: string,
    ): Promise<ClinicMembersUsageSummaryDto> {
        const entries = await this.subscriptionService.getClinicUsage(clinicId);
        const now = new Date();
        const period = {year: now.getFullYear(), month: now.getMonth() + 1};
        return new ClinicMembersUsageSummaryDto(period, entries);
    }

    @ApiOperation({
        summary: 'List active add-ons for all members in a clinic (admin/owner only)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Clinic-wide add-on breakdown', type: [MemberActiveAddonsDto]}],
    })
    @Authorize(SubscriptionPermission.VIEW_CLINIC)
    @Get('clinics/:clinicId/addons')
    async getClinicAddons(
        @RequestActor() _actor: Actor,
        @Param('clinicId') clinicId: string,
    ): Promise<MemberActiveAddonsDto[]> {
        const groups = await this.subscriptionService.getClinicActiveAddons(clinicId);
        return groups.map((g) => new MemberActiveAddonsDto(g.memberId, g.addons));
    }

    /**
     * @deprecated Use GET /clinics/:clinicId/members/usage for the full breakdown.
     */
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
