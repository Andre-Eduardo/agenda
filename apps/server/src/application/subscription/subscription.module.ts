import {Module} from '@nestjs/common';
import {IPaymentProvider} from '@application/payment/providers/payment-provider.interface';
import {PAYMENT_PROVIDER_FACTORY_PROVIDERS, paymentProviderFactory} from '@application/payment/providers/payment-provider.factory';
import {UsageLimitGuard} from '@application/subscription/guards/usage-limit.guard';
import {SubscriptionController} from '@application/subscription/subscription.controller';
import {SubscriptionService} from '@application/subscription/subscription.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {EnvConfigService} from '@infrastructure/config';

@Module({
    imports: [InfrastructureModule],
    controllers: [SubscriptionController],
    providers: [
        ...PAYMENT_PROVIDER_FACTORY_PROVIDERS,
        {
            provide: IPaymentProvider,
            useFactory: paymentProviderFactory,
            inject: [EnvConfigService, ...PAYMENT_PROVIDER_FACTORY_PROVIDERS],
        },
        SubscriptionService,
        UsageLimitGuard,
    ],
    exports: [SubscriptionService, UsageLimitGuard],
})
export class SubscriptionModule {}
