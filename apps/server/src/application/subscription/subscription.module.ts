import {Module} from '@nestjs/common';
import {ClinicLicenseModule} from '@application/clinic-license/clinic-license.module';
import {
    PAYMENT_PROVIDER_FACTORY_PROVIDERS,
    paymentProviderFactory,
} from '@application/payment/providers/payment-provider.factory';
import {IPaymentProvider} from '@application/payment/providers/payment-provider.interface';
import {UsageLimitGuard} from '@application/subscription/guards/usage-limit.guard';
import {SubscriptionController} from '@application/subscription/subscription.controller';
import {SubscriptionService} from '@application/subscription/subscription.service';
import {EnvConfigService} from '@infrastructure/config';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ClinicLicenseModule],
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
