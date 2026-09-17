import {Module} from '@nestjs/common';
import {PaymentController} from '@application/payment/payment.controller';
import {PaymentService} from '@application/payment/payment.service';
import {IPaymentProvider} from '@application/payment/providers/payment-provider.interface';
import {PAYMENT_PROVIDER_FACTORY_PROVIDERS, paymentProviderFactory} from '@application/payment/providers/payment-provider.factory';
import {AsaasWebhookController} from '@application/payment/webhooks/asaas-webhook.controller';
import {AsaasWebhookService} from '@application/payment/webhooks/asaas-webhook.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {EnvConfigService} from '@infrastructure/config';

@Module({
    imports: [InfrastructureModule],
    controllers: [PaymentController, AsaasWebhookController],
    providers: [
        ...PAYMENT_PROVIDER_FACTORY_PROVIDERS,
        {
            provide: IPaymentProvider,
            useFactory: paymentProviderFactory,
            inject: [EnvConfigService, ...PAYMENT_PROVIDER_FACTORY_PROVIDERS],
        },
        PaymentService,
        AsaasWebhookService,
    ],
    exports: [PaymentService],
})
export class PaymentModule {}
