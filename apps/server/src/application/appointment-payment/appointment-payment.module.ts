import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AppointmentPaymentController } from "@application/appointment-payment/controllers/appointment-payment.controller";
import {
  GetPaymentByAppointmentService,
  RegisterPaymentService,
  UpdatePaymentStatusService,
} from "@application/appointment-payment/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [AppointmentPaymentController],
  providers: [RegisterPaymentService, UpdatePaymentStatusService, GetPaymentByAppointmentService],
})
export class AppointmentPaymentModule {}
