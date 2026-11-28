import {Module} from '@nestjs/common';
import {AppointmentPaymentController} from '@application/appointment-payment/controllers/appointment-payment.controller';
import {
    GetPaymentByAppointmentService,
    GetPaymentLedgerService,
    ReceivePaymentService,
    RefundPaymentService,
    RegisterPaymentService,
    UpdatePaymentStatusService,
} from '@application/appointment-payment/services';
import {AppointmentLedger} from '@domain/financial-entry/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AppointmentPaymentController],
    providers: [
        AppointmentLedger,
        RegisterPaymentService,
        UpdatePaymentStatusService,
        GetPaymentByAppointmentService,
        GetPaymentLedgerService,
        ReceivePaymentService,
        RefundPaymentService,
    ],
})
export class AppointmentPaymentModule {}
