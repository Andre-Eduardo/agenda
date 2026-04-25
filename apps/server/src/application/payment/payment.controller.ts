import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../domain/@shared/actor';
import {PaymentPermission} from '../../domain/auth';
import {toEnum} from '../../domain/@shared/utils';
import {Authorize} from '../@shared/auth';
import {RequestActor} from '../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../@shared/openapi/decorators';
import {entityIdParam} from '../@shared/openapi/params';
import {PlanCodeRecord} from '../subscription/subscription-plans.config';
import {PaymentService} from './payment.service';
import {ActivateSubscriptionDto} from './dto/activate-subscription.dto';
import {ChangePaymentPlanDto} from './dto/change-plan.dto';
import {PaymentEventDto} from './dto/payment-event.dto';

@ApiTags('Payment')
@Controller('')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @ApiOperation({
        summary: 'Activate a recurring subscription for a professional member via Asaas',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 201, description: 'Subscription activated'},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(PaymentPermission.MANAGE)
    @Post('members/:memberId/subscription/activate')
    async activateSubscription(
        @RequestActor() actor: Actor,
        @Param('memberId') memberId: string,
        @Body() payload: ActivateSubscriptionDto,
    ) {
        const planCode = toEnum(PlanCodeRecord, payload.planCode);
        return this.paymentService.activateSubscription(
            memberId,
            actor.clinicId.toString(),
            planCode,
            payload.paymentMethod as 'CREDIT_CARD' | 'PIX' | 'BOLETO',
            payload.cpfCnpj,
        );
    }

    @ApiOperation({
        summary: 'Cancel the Asaas subscription for a professional member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 204, description: 'Subscription cancelled'},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(PaymentPermission.MANAGE)
    @Delete('members/:memberId/subscription')
    @HttpCode(HttpStatus.NO_CONTENT)
    async cancelSubscription(
        @RequestActor() _actor: Actor,
        @Param('memberId') memberId: string,
    ): Promise<void> {
        await this.paymentService.cancelSubscription(memberId);
    }

    @ApiOperation({
        summary: 'Change the plan for a member — cancels current Asaas subscription and creates new one',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 200, description: 'Plan changed'},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(PaymentPermission.MANAGE)
    @Patch('members/:memberId/subscription/plan')
    async changePlan(
        @RequestActor() _actor: Actor,
        @Param('memberId') memberId: string,
        @Body() payload: ChangePaymentPlanDto,
    ) {
        const planCode = toEnum(PlanCodeRecord, payload.planCode);
        return this.paymentService.changePlanAndCharge(memberId, planCode, payload.paymentMethod);
    }

    @ApiOperation({
        summary: 'List payment events for a professional member (most recent first)',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [
            {status: 200, description: 'Payment history', type: [PaymentEventDto]},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Subscription not found'},
        ],
    })
    @Authorize(PaymentPermission.VIEW)
    @Get('members/:memberId/subscription/payments')
    async listPayments(
        @RequestActor() _actor: Actor,
        @Param('memberId') memberId: string,
    ): Promise<PaymentEventDto[]> {
        const events = await this.paymentService.listPayments(memberId);
        return events.map((e) => new PaymentEventDto(e));
    }
}
