import {Module} from '@nestjs/common';
import {AppointmentPaymentController} from '@application/appointment-payment/controllers/appointment-payment.controller';
import {
    GetPaymentByAppointmentService,
    RegisterPaymentService,
    UpdatePaymentStatusService,
} from '@application/appointment-payment/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AppointmentPaymentController],
    providers: [RegisterPaymentService, UpdatePaymentStatusService, GetPaymentByAppointmentService],
})
export class AppointmentPaymentModule {}
