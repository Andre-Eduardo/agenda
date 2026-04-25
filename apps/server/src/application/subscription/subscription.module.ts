import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {SubscriptionController} from './subscription.controller';
import {SubscriptionService} from './subscription.service';

@Module({
    imports: [InfrastructureModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
