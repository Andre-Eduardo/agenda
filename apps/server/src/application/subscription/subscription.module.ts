import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { SubscriptionController } from "@application/subscription/subscription.controller";
import { SubscriptionService } from "@application/subscription/subscription.service";
import { UsageLimitGuard } from "@application/subscription/guards/usage-limit.guard";

@Module({
  imports: [InfrastructureModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, UsageLimitGuard],
  exports: [SubscriptionService, UsageLimitGuard],
})
export class SubscriptionModule {}
