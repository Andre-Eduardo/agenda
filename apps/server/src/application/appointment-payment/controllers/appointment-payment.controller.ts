import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {entityId} from '@application/@shared/validation/schemas';
import {
    AppointmentPaymentDto,
    AppointmentPaymentLedgerDto,
    ReceivePaymentDto,
    RefundPaymentDto,
    RegisterPaymentDto,
    UpdatePaymentStatusDto,
} from '@application/appointment-payment/dtos';
import {
    GetPaymentByAppointmentService,
    GetPaymentLedgerService,
    ReceivePaymentService,
    RefundPaymentService,
    RegisterPaymentService,
    UpdatePaymentStatusService,
} from '@application/appointment-payment/services';
import {Actor} from '@domain/@shared/actor';
import {AppointmentId} from '@domain/appointment/entities';
import {AppointmentPaymentPermission} from '@domain/auth';

const appointmentIdSchema = z.object({id: entityId(AppointmentId)});

@ApiTags('Appointment Payment')
@Controller('appointments/:id/payment')
export class AppointmentPaymentController {
    constructor(
        private readonly registerPaymentService: RegisterPaymentService,
        private readonly updatePaymentStatusService: UpdatePaymentStatusService,
        private readonly getPaymentByAppointmentService: GetPaymentByAppointmentService,
        private readonly getPaymentLedgerService: GetPaymentLedgerService,
        private readonly receivePaymentService: ReceivePaymentService,
        private readonly refundPaymentService: RefundPaymentService
    ) {}

    @ApiOperation({
        summary: 'Register payment for a completed appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 201, description: 'Payment registered', type: AppointmentPaymentDto},
            {status: 400, description: 'Invalid input or INSURANCE without insurancePlanId'},
            {status: 409, description: 'Payment already registered for this appointment'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.REGISTER)
    @Post()
    registerPayment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: RegisterPaymentDto
    ): Promise<AppointmentPaymentDto> {
        return this.registerPaymentService.execute({
            actor,
            payload: {...payload, appointmentId: id},
        });
    }

    @ApiOperation({
        summary: 'Update payment status for an appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 200, description: 'Payment updated', type: AppointmentPaymentDto},
            {status: 404, description: 'Appointment or payment not found'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.UPDATE)
    @Patch()
    updatePaymentStatus(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: UpdatePaymentStatusDto
    ): Promise<AppointmentPaymentDto> {
        return this.updatePaymentStatusService.execute({
            actor,
            payload: {...payload, appointmentId: id},
        });
    }

    @ApiOperation({
        summary: 'Get payment for an appointment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 200, description: 'Payment found', type: AppointmentPaymentDto},
            {status: 404, description: 'Appointment or payment not found'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.VIEW)
    @Get()
    getPaymentByAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentPaymentDto> {
        return this.getPaymentByAppointmentService.execute({actor, payload: {appointmentId: id}});
    }

    @ApiOperation({
        summary: 'Get the receipts and refunds of an appointment payment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 200, description: 'Payment ledger', type: AppointmentPaymentLedgerDto},
            {status: 404, description: 'Appointment or payment not found'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.VIEW)
    @Get('ledger')
    getPaymentLedger(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId
    ): Promise<AppointmentPaymentLedgerDto> {
        return this.getPaymentLedgerService.execute({actor, payload: {appointmentId: id}});
    }

    @ApiOperation({
        summary: 'Receive one or more parts of an open appointment payment',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 201, description: 'Receipts registered', type: AppointmentPaymentLedgerDto},
            {status: 409, description: 'Payment already settled, or parts exceed what is left to receive'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.REGISTER)
    @Post('receipts')
    receivePayment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: ReceivePaymentDto
    ): Promise<AppointmentPaymentLedgerDto> {
        return this.receivePaymentService.execute({actor, payload: {...payload, appointmentId: id}});
    }

    @ApiOperation({
        summary: 'Refund everything received for an appointment payment, with a reason',
        parameters: [entityIdParam('Appointment ID')],
        responses: [
            {status: 201, description: 'Payment refunded', type: AppointmentPaymentLedgerDto},
            {status: 409, description: 'Nothing to refund'},
        ],
    })
    @Authorize(AppointmentPaymentPermission.REFUND)
    @Post('refund')
    refundPayment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: RefundPaymentDto
    ): Promise<AppointmentPaymentLedgerDto> {
        return this.refundPaymentService.execute({actor, payload: {...payload, appointmentId: id}});
    }
}
