import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { BillingReportController } from "@application/billing/billing-report.controller";
import { BillingReportService } from "@application/billing/billing-report.service";

@Module({
  imports: [InfrastructureModule],
  controllers: [BillingReportController],
  providers: [BillingReportService],
  exports: [BillingReportService],
})
export class BillingModule {}
