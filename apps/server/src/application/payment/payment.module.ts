import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { IPaymentProvider } from "@application/payment/providers/payment-provider.interface";
import { AsaasPaymentAdapter } from "@application/payment/providers/asaas.adapter";
import { PaymentService } from "@application/payment/payment.service";
import { PaymentController } from "@application/payment/payment.controller";
import { AsaasWebhookService } from "@application/payment/webhooks/asaas-webhook.service";
import { AsaasWebhookController } from "@application/payment/webhooks/asaas-webhook.controller";

@Module({
  imports: [InfrastructureModule],
  controllers: [PaymentController, AsaasWebhookController],
  providers: [
    { provide: IPaymentProvider, useClass: AsaasPaymentAdapter },
    AsaasPaymentAdapter,
    PaymentService,
    AsaasWebhookService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
