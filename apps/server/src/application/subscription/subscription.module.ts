import {Module} from '@nestjs/common';
import {UsageLimitGuard} from '@application/subscription/guards/usage-limit.guard';
import {SubscriptionController} from '@application/subscription/subscription.controller';
import {SubscriptionService} from '@application/subscription/subscription.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, UsageLimitGuard],
    exports: [SubscriptionService, UsageLimitGuard],
})
export class SubscriptionModule {}
