import {Module} from '@nestjs/common';
import {OnboardingController} from '@application/onboarding/controllers';
import {OnboardSoloService} from '@application/onboarding/services';
import {SubscriptionModule} from '@application/subscription/subscription.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, SubscriptionModule],
    controllers: [OnboardingController],
    providers: [OnboardSoloService],
})
export class OnboardingModule {}
