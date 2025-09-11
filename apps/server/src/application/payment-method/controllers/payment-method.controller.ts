import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {PaymentMethodPermission} from '../../../domain/auth';
import {PaymentMethodId} from '../../../domain/payment-method/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreatePaymentMethodDto,
    getPaymentMethodSchema,
    UpdatePaymentMethodInputDto,
    updatePaymentMethodSchema,
    PaymentMethodDto,
    deletePaymentMethodSchema,
    ListPaymentMethodDto,
} from '../dtos';
import {
    CreatePaymentMethodService,
    DeletePaymentMethodService,
    GetPaymentMethodService,
    ListPaymentMethodService,
    UpdatePaymentMethodService,
} from '../services';

@ApiTags('Payment method')
@Controller('payment-method')
export class PaymentMethodController {
    constructor(
        private readonly createPaymentMethodService: CreatePaymentMethodService,
        private readonly listPaymentMethodService: ListPaymentMethodService,
        private readonly getPaymentMethodService: GetPaymentMethodService,
        private readonly updateCompanyService: UpdatePaymentMethodService,
        private readonly deletePaymentMethodService: DeletePaymentMethodService
    ) {}

    @ApiOperation({
        summary: 'Creates a new payment method',
        responses: [
            {
                status: 201,
                description: 'Payment method created',
                type: PaymentMethodDto,
            },
        ],
    })
    @Authorize(PaymentMethodPermission.CREATE)
    @Post()
    async createPaymentMethod(
        @RequestActor() actor: Actor,
        @Body() payload: CreatePaymentMethodDto
    ): Promise<PaymentMethodDto> {
        return this.createPaymentMethodService.execute({actor, payload});
    }

    @ApiPaginatedOperation({
        summary: 'Finds payment methods',
        responses: [
            {
                status: 200,
                description: 'Payment methods found',
                model: PaymentMethodDto,
            },
        ],
    })
    @Authorize(PaymentMethodPermission.VIEW)
    @Get()
    async listPaymentMethod(
        @RequestActor() actor: Actor,
        @Query() payload: ListPaymentMethodDto
    ): Promise<PaginatedDto<PaymentMethodDto>> {
        return this.listPaymentMethodService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a payment method',
        parameters: [entityIdParam('Payment method ID')],
        responses: [
            {
                status: 200,
                description: 'Payment method found',
                type: PaymentMethodDto,
            },
        ],
    })
    @Authorize(PaymentMethodPermission.VIEW)
    @Get(':id')
    async getPaymentMethod(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getPaymentMethodSchema.shape.id) id: PaymentMethodId
    ): Promise<PaymentMethodDto> {
        return this.getPaymentMethodService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a payment method',
        parameters: [entityIdParam('Payment method ID')],
        responses: [
            {
                status: 200,
                description: 'Payment method updated',
                type: PaymentMethodDto,
            },
        ],
    })
    @Authorize(PaymentMethodPermission.UPDATE)
    @Put(':id')
    async updatePaymentMethod(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updatePaymentMethodSchema.shape.id) id: PaymentMethodId,
        @Body() payload: UpdatePaymentMethodInputDto
    ): Promise<PaymentMethodDto> {
        return this.updateCompanyService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a payment method',
        parameters: [entityIdParam('Payment method ID')],
        responses: [
            {
                status: 200,
                description: 'Payment method deleted',
            },
        ],
    })
    @Authorize(PaymentMethodPermission.DELETE)
    @Delete(':id')
    async deletePaymentMethod(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deletePaymentMethodSchema.shape.id) id: PaymentMethodId
    ): Promise<void> {
        await this.deletePaymentMethodService.execute({actor, payload: {id}});
    }
}
