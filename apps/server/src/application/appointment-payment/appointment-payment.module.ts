import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AppointmentPaymentController} from './controllers/appointment-payment.controller';
import {
    GetPaymentByAppointmentService,
    RegisterPaymentService,
    UpdatePaymentStatusService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [AppointmentPaymentController],
    providers: [
        RegisterPaymentService,
        UpdatePaymentStatusService,
        GetPaymentByAppointmentService,
    ],
})
export class AppointmentPaymentModule {}
