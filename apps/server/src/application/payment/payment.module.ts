import {Module} from '@nestjs/common';
import {PaymentController} from '@application/payment/payment.controller';
import {PaymentService} from '@application/payment/payment.service';
import {AsaasPaymentAdapter} from '@application/payment/providers/asaas.adapter';
import {IPaymentProvider} from '@application/payment/providers/payment-provider.interface';
import {AsaasWebhookController} from '@application/payment/webhooks/asaas-webhook.controller';
import {AsaasWebhookService} from '@application/payment/webhooks/asaas-webhook.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PaymentController, AsaasWebhookController],
    providers: [
        {provide: IPaymentProvider, useClass: AsaasPaymentAdapter},
        AsaasPaymentAdapter,
        PaymentService,
        AsaasWebhookService,
    ],
    exports: [PaymentService],
})
export class PaymentModule {}
