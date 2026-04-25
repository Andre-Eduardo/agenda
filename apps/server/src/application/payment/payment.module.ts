import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {IPaymentProvider} from './providers/payment-provider.interface';
import {AsaasPaymentAdapter} from './providers/asaas.adapter';
import {PaymentService} from './payment.service';
import {PaymentController} from './payment.controller';
import {AsaasWebhookService} from './webhooks/asaas-webhook.service';
import {AsaasWebhookController} from './webhooks/asaas-webhook.controller';

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
