import {Body, Controller, Get, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {AppointmentId} from '../../../domain/appointment/entities';
import {AppointmentPaymentPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {entityId} from '../../@shared/validation/schemas';
import {AppointmentPaymentDto, RegisterPaymentDto, UpdatePaymentStatusDto} from '../dtos';
import {
    GetPaymentByAppointmentService,
    RegisterPaymentService,
    UpdatePaymentStatusService,
} from '../services';

const appointmentIdSchema = z.object({id: entityId(AppointmentId)});

@ApiTags('Appointment Payment')
@Controller('appointments/:id/payment')
export class AppointmentPaymentController {
    constructor(
        private readonly registerPaymentService: RegisterPaymentService,
        private readonly updatePaymentStatusService: UpdatePaymentStatusService,
        private readonly getPaymentByAppointmentService: GetPaymentByAppointmentService,
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
    async registerPayment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: RegisterPaymentDto,
    ): Promise<AppointmentPaymentDto> {
        return this.registerPaymentService.execute({actor, payload: {...payload, appointmentId: id}});
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
    async updatePaymentStatus(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
        @Body() payload: UpdatePaymentStatusDto,
    ): Promise<AppointmentPaymentDto> {
        return this.updatePaymentStatusService.execute({actor, payload: {...payload, appointmentId: id}});
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
    async getPaymentByAppointment(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', appointmentIdSchema.shape.id) id: AppointmentId,
    ): Promise<AppointmentPaymentDto> {
        return this.getPaymentByAppointmentService.execute({actor, payload: {appointmentId: id}});
    }
}
