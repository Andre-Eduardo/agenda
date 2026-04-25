import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {SubscriptionController} from './subscription.controller';
import {SubscriptionService} from './subscription.service';
import {UsageLimitGuard} from './guards/usage-limit.guard';

@Module({
    imports: [InfrastructureModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, UsageLimitGuard],
    exports: [SubscriptionService, UsageLimitGuard],
})
export class SubscriptionModule {}
